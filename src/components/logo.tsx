import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2'>
      <Image
        src='/icon-72x72.png'
        width={32}
        height={32}
        priority
        quality={100}
        alt='DayKickOff logo mark'
      />
      <span className='font-alt text-xl'>DayKickOff</span>
    </Link>
  );
}
