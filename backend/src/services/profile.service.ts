import prisma from '../config/prisma.js'
import { scoreQueue } from './score-queue.service.js'

export class ProfileService {
  static async getProfile(orgId: string) {
    let profile = await prisma.smeProfile.findUnique({
      where: { orgId },
      include: { beneficialOwners: true },
    })

    if (!profile) {
      // Fetch organization name to use as default legalName
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true }
      })

      profile = await prisma.smeProfile.create({
        data: {
          orgId,
          legalName: org?.name || 'Ma PME',
        },
        include: { beneficialOwners: true },
      })
    }

    return profile
  }

  static async updateProfile(orgId: string, data: any) {
    const { beneficialOwners, ...profileData } = data

    // Convert dates if they are strings
    if (profileData.foundedDate) {
      const date = new Date(profileData.foundedDate)
      profileData.foundedDate = isNaN(date.getTime()) ? null : date
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Find current profile
      const currentProfile = await tx.smeProfile.findUnique({
        where: { orgId },
      })

      if (!currentProfile) {
        throw new Error('Profile not found')
      }

      // Update SmeProfile
      const updatedSmeProfile = await tx.smeProfile.update({
        where: { orgId },
        data: profileData,
      })

      // Update BeneficialOwners if provided
      if (beneficialOwners && Array.isArray(beneficialOwners)) {
        // Delete old ones
        await tx.beneficialOwner.deleteMany({
          where: { profileId: updatedSmeProfile.id },
        })

        // Create new ones
        if (beneficialOwners.length > 0) {
          await tx.beneficialOwner.createMany({
            data: beneficialOwners.map((bo: any) => {
              const { id, profileId, ...rest } = bo // Remove id and profileId if present
              if (rest.birthDate) {
                const bDate = new Date(rest.birthDate)
                rest.birthDate = isNaN(bDate.getTime()) ? null : bDate
              }
              return {
                ...rest,
                profileId: updatedSmeProfile.id,
              }
            }),
          })
        }
      }

      return await tx.smeProfile.findUnique({
        where: { orgId },
        include: { beneficialOwners: true },
      })
    })

    // Déclenche un recalcul asynchrone du score après mise à jour du profil/UBOs
    scoreQueue.enqueue(orgId)

    return updatedProfile
  }
}
