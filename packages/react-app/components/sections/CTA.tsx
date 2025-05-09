import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

export default function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary/5 p-8 lg:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">
              Stay Updated with AfriCycle
            </h2>
            <p className="text-xl font-medium text-muted-foreground mb-8">
              Subscribe to our newsletter to receive updates about our impact, new features, and opportunities to join our mission.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 text-lg h-12"
                required
              />
              <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8">
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

