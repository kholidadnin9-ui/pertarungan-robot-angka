return (
  <div className="fixed inset-0 overflow-hidden bg-[#05070f]">
    {/* battlefield background */}
    <img
      src={`${import.meta.env.BASE_URL}bg/battlefield.jpg`}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />

    <div className="absolute inset-0 bg-linear-to-b from-[#04060e]/80 via-transparent to-[#04060e]/85" />
    <Embers count={14} />

    {/* shakeable arena */}
    <div
      key={shakeKey}
      className={`relative z-10 flex h-full flex-col ${
        shakeKey > 0 ? 'screen-shake' : ''
      }`}
    >
