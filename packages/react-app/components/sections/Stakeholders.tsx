import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Users, Factory, Building, Home, Check } from "lucide-react"

export default function Stakeholders() {
  const stakeholders = [
    {
      icon: <Users className="h-14 w-14 text-primary" />,
      title: "Waste Collectors",
      description:
        "Primarily informal workers who gain financial inclusion and fair compensation through the platform.",
      benefits: [
        "Direct cryptocurrency payments",
        "Financial inclusion",
        "Increased earnings",
        "Verified work history",
      ],
    },
    {
      icon: <Factory className="h-14 w-14 text-primary" />,
      title: "Recycling Facilities",
      description:
        "Partners who receive consistent, verified waste streams and can trace materials through the supply chain.",
      benefits: ["Consistent waste supply", "Quality verification", "Transparent operations", "Expanded market access"],
    },
    {
      icon: <Building className="h-14 w-14 text-primary" />,
      title: "Corporations",
      description:
        "Entities seeking verifiable sustainability credits and access to recycled materials for their operations.",
      benefits: [
        "Verified sustainability credits",
        "ESG compliance reporting",
        "Supply chain transparency",
        "Brand reputation enhancement",
      ],
    },
    {
      icon: <Home className="h-14 w-14 text-primary" />,
      title: "Local Communities",
      description:
        "Beneficiaries of cleaner environments, reduced pollution, and new economic development opportunities.",
      benefits: ["Cleaner environment", "Reduced pollution", "Economic development", "Improved public health"],
    },
  ]

  return (
    <section id="stakeholders" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Serving Multiple Stakeholders
          </h2>
          <p className="mt-4 text-xl font-medium text-muted-foreground">
            AfriCycle creates value for everyone in the waste management ecosystem, from collectors to corporations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stakeholders.map((stakeholder, index) => (
            <div key={index} className="rounded-2xl border bg-background p-8 shadow-sm transition-all hover:shadow-md max-w-[320px] mx-auto w-full">
              <div className="mb-8">{stakeholder.icon}</div>
              <h3 className="text-2xl font-bold text-foreground mb-5">{stakeholder.title}</h3>
              <p className="text-lg font-medium text-muted-foreground mb-8">{stakeholder.description}</p>

              <h4 className="text-base font-semibold text-foreground mb-4">Key Benefits:</h4>
              <ul className="space-y-4">
                {stakeholder.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-6 w-6 text-primary mr-3 shrink-0 mt-0.5" />
                    <span className="text-base font-medium text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-6">
                Creating a Sustainable Ecosystem
              </h3>
              <p className="text-xl font-medium text-muted-foreground mb-6">
                By connecting all stakeholders in a transparent, blockchain-verified platform, AfriCycle creates a
                self-sustaining ecosystem that addresses both environmental and economic challenges.
              </p>
              <p className="text-lg font-medium text-muted-foreground mb-8">
                Our platform ensures that waste collectors receive fair compensation, recycling facilities get
                consistent supply, corporations achieve sustainability goals, and communities benefit from cleaner
                environments.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Join the Ecosystem
              </Button>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=1374&auto=format&fit=crop"
                alt="AfriCycle Ecosystem"
                width={600}
                height={400}
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

