import Image from 'next/image'

const Header = () => (
  <header className="w-full bg-gray-900 py-4 px-4 sm:px-6 flex items-center justify-center sm:justify-start">
    <div className="w-40 sm:w-56">
      <Image
        src="/gamelayer-logo.png"
        alt="GameLayer Logo"
        width={220}
        height={64}
        priority
        className="w-full h-auto"
      />
    </div>
  </header>
)

export default Header 