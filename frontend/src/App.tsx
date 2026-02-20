import { TrendingUp, ShieldCheck, Zap } from "lucide-react";
import React from "react";

function App() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[90vh] p-4 text-center">
			<div className="animate-fade-in">
				<h1 className="text-5xl font-bold tracking-tight mb-4">
					UBB <span className="text-trust">Platform</span>
				</h1>
				<p className="text-muted-foreground text-xl max-w-2xl mb-12">
					Transformez votre PME informelle en une entité crédible et finançable
					grâce à nos modules de gestion de flux et de confiance.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
					{/* UBB Flow Card */}
					<div className="glass p-8 rounded-2xl glow-flow text-left hover:scale-[1.02] transition-transform">
						<div className="bg-flow/20 p-3 rounded-lg w-fit mb-4">
							<TrendingUp className="text-flow w-8 h-8" />
						</div>
						<h2 className="text-2xl font-semibold mb-2">UBB Flow</h2>
						<p className="text-muted-foreground">
							Intelligence de trésorerie, prévisions à 90 jours et score de
							préparation financière.
						</p>
					</div>

					{/* UBB Trust Card */}
					<div className="glass p-8 rounded-2xl glow-trust text-left hover:scale-[1.02] transition-transform">
						<div className="bg-trust/20 p-3 rounded-lg w-fit mb-4">
							<ShieldCheck className="text-trust w-8 h-8" />
						</div>
						<h2 className="text-2xl font-semibold mb-2">UBB Trust</h2>
						<p className="text-muted-foreground">
							Coffre-fort documentaire, checklists de conformité et score de
							crédibilité.
						</p>
					</div>
				</div>

				<button className="mt-12 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium flex items-center gap-2 group mx-auto">
					Démarrer le diagnostic
					<Zap className="w-4 h-4 group-hover:fill-current" />
				</button>
			</div>
		</div>
	);
}

export default App;
