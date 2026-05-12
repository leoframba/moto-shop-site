// apps/frontend/app/page.tsx

export default async function Home() {
  const res = await fetch('http://127.0.0.1:8000/api/services', {
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    return <div className="p-10 text-red-500">Failed to load services</div>;
  }

  const data = await res.json();
  const services = data.services;
  const hourlyRate = data.hourly_rate;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 p-8 md:p-24 font-sans">
      <div className="max-w-4xl mx-auto border border-neutral-800 rounded-2xl bg-neutral-900 overflow-hidden shadow-2xl">
        
        {/* Header Section */}
        <div className="bg-neutral-950 p-8 border-b border-neutral-800 flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">
              Service Menu
            </h1>
            <p className="text-neutral-400">Professional maintenance & repair.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">Shop Rate</p>
            <p className="text-2xl font-mono text-emerald-400">${hourlyRate}/hr</p>
          </div>
        </div>

        {/* Services List */}
        <div className="divide-y divide-neutral-800">
          {services.map((service: any) => (
            <div key={service.id} className="p-8 hover:bg-neutral-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold text-white mb-1">{service.name}</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <span className="text-xs text-neutral-500 uppercase">Est. Time</span>
                  <p className="text-sm font-mono text-neutral-300">{service.estimated_hours} hrs</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 uppercase">Price</span>
                  <p className="text-2xl font-mono text-white">${service.calculated_price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}