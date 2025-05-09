import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2, Cpu, Hammer, ArrowRight } from "lucide-react"

export default function WasteStreams() {
  const streams = [
    {
      icon: <Trash2 className="h-14 w-14 text-primary" />,
      title: "Plastic Waste",
      description:
        "Collection and verification of PET bottles and other recyclable plastics with QR code batch verification and weight-based validation.",
      stats: "17M tons annually",
      color: "from-green-50 to-green-100",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    },
    {
      icon: <Cpu className="h-14 w-14 text-primary" />,
      title: "Electronic Waste",
      description:
        "Specialized collection of valuable electronic components with detailed documentation and proper handling of hazardous materials.",
      stats: "2.9M tons annually",
      color: "from-amber-50 to-amber-100",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
    },
    {
      icon: <Hammer className="h-14 w-14 text-primary" />,
      title: "Metal & General Waste",
      description:
        "Categorization into ferrous, non-ferrous, and other materials with weight-based verification and quality assessment.",
      stats: "90% uncontrolled disposal",
      color: "from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
    },
  ]

  return (
    <section id="waste-streams" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Multi-Stream Waste Management
          </h2>
          <p className="mt-4 text-xl font-medium text-muted-foreground">
            AfriCycle addresses three key waste streams across Africa, each with specialized collection and verification
            processes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {streams.map((stream, index) => (
            <div key={index} className="relative overflow-hidden rounded-2xl shadow-sm border">
              <div className={`absolute inset-0 bg-gradient-to-br ${stream.color} opacity-50`}></div>
              <div className="relative p-8">
                <div className={`rounded-full ${stream.bgColor} p-4 inline-block mb-6`}>{stream.icon}</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{stream.title}</h3>
                <p className="text-lg font-medium text-muted-foreground mb-6">{stream.description}</p>
                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${stream.textColor} ${stream.bgColor} mb-6`}
                >
                  {stream.stats}
                </div>
                <Button variant="outline" className="w-full justify-between">
                  Learn More <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-2xl bg-primary/5 p-8 lg:p-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-6">
                Only 4% of waste in Africa is currently recycled
              </h3>
              <p className="text-xl font-medium text-muted-foreground mb-8">
                AfriCycle is changing this reality by connecting informal waste collectors directly with recycling
                facilities and corporate partners, creating a sustainable ecosystem that scales across the continent.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Join Our Mission <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=1470&auto=format&fit=crop"
                alt="Waste collection in Africa"
                width={600}
                height={400}
                className="rounded-xl shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-background rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-5xl font-extrabold text-primary">96%</div>
                  <div className="text-sm">
                    <p className="font-bold">Untapped Potential</p>
                    <p className="text-muted-foreground">for recycling in Africa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

