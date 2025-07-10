import { Recycle, Wallet, BarChart3, ShieldCheck, Users, Globe } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: <Recycle className="h-12 w-12 text-primary" />,
      title: "Multi-Stream Collection",
      description:
        "Specialized systems for plastic, e-waste, and metal/general waste with stream-specific validation logic.",
    },
    {
      icon: <Wallet className="h-12 w-12 text-primary" />,
      title: "Dual Income System",
      description: "Collectors earn cUSD payments for waste collection work plus daily G$ (GoodDollar) UBI claims as supplemental income, creating stable financial support.",
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-primary" />,
      title: "Marketplace Ecosystem",
      description: "Trading platform for recycled materials and carbon/waste offset marketplace for corporations.",
    },
    {
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
      title: "Blockchain Verification",
      description:
        "Decentralized authentication of waste collection with immutable record-keeping of recycling activities.",
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "Financial Inclusion",
      description: "Bringing unbanked waste collectors into the financial ecosystem with fair compensation.",
    },
    {
      icon: <Globe className="h-12 w-12 text-primary" />,
      title: "Environmental Impact",
      description:
        "Addressing Africa's 17 million tons of annual plastic waste with verified sustainability solutions.",
    },
  ]

  return (
    <section id="features" className="py-24 bg-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Transforming Waste Management with Blockchain
          </h2>
          <p className="mt-4 text-xl font-medium text-muted-foreground">
            AfriCycle leverages ReFi principles to create economic opportunities while solving environmental challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative rounded-2xl bg-background p-8 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
              <p className="text-lg font-medium text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

