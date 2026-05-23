export const Background = () => {
  return (
    <div className="fixed flex h-screen w-full items-center justify-center overflow-hidden">
      <div className="relative h-96 w-screen md:h-192 md:w-3xl">
        <div className="absolute top-[-10%] left-[-15%] h-32 w-32 animate-grow rounded-full bg-fuchsia-700 opacity-50 blur-3xl filter md:h-96 md:w-96 md:opacity-10"></div>
        <div className="animation-delay-4000 absolute left-[15%] top-[25%] h-48 w-48 animate-grow rounded-full bg-indigo-700 opacity-20 blur-3xl filter md:h-72 md:w-72 md:opacity-20"></div>
        <div className="animation-delay-8000 absolute bottom-[-25%] h-64 w-64 animate-grow rounded-full bg-emerald-700 opacity-20 blur-3xl filter md:bottom-[-5%] md:left-[-15%] md:h-128 md:w-lg md:opacity-15"></div>
        <div className="animation-delay-2000 absolute right-[-25%] h-80 w-80 animate-grow rounded-full bg-blue-700 opacity-20 blur-3xl filter md:h-128 md:w-lg md:opacity-20"></div>
        <div className="animation-delay-6000 absolute bottom-[10%] right-[0%] h-64 w-64 animate-grow rounded-full bg-rose-700 opacity-20 blur-3xl filter md:h-96 md:w-96 md:opacity-10"></div>
      </div>
    </div>
  );
};
