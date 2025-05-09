export default function Stats() {
    const stats = [
      { value: "17M", label: "Tons of plastic waste annually in Africa" },
      { value: "2.9M", label: "Tons of e-waste dumped in Africa each year" },
      { value: "4%", label: "Current recycling rate across Africa" },
      { value: "90%", label: "Waste disposed at uncontrolled sites" },
    ]
  
    return (
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  
  