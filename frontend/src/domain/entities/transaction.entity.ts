export enum TxnDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TxnMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  CREDIT = 'CREDIT',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER',
}

export enum TxnCategory {
  SALES = 'SALES',
  COGS = 'COGS',
  PAYROLL = 'PAYROLL',
  RENT_UTILITIES = 'RENT_UTILITIES',
  TRANSPORT = 'TRANSPORT',
  TAX = 'TAX',
  DEBT_SERVICE = 'DEBT_SERVICE',
  CAPEX = 'CAPEX',
  OWNER_DRAW = 'OWNER_DRAW',
  FEES = 'FEES',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER',
}

export interface Transaction {
  id: string
  occurredAt: string
  direction: TxnDirection
  amount: number
  currency: string
  method: TxnMethod
  category: TxnCategory
  counterparty?: string
  notes?: string
  orgId: string
  accountId: string
  createdAt: string
  updatedAt: string
  account?: {
    name: string
    type: string
  }
  evidenceFiles?: EvidenceFile[]
}

export interface EvidenceFile {
  id: string
  txnId: string
  fileUrl: string
  fileName: string
}

export interface CreateTransactionRequest {
  amount: number
  direction: TxnDirection
  currency?: string
  method: TxnMethod
  category: TxnCategory
  counterparty?: string
  notes?: string
  occurredAt?: string
  accountId: string
}
