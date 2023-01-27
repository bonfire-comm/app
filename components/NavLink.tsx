import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  href: string;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export default function NavLink({
  children,
  href,
  className = 'flex p-3 rounded-lg gap-1 items-center',
  inactiveClassName = 'hover:bg-cloudy-600 hover:bg-opacity-50',
  activeClassName = 'bg-cloudy-600 bg-opacity-75'
}: Props) {
  const router = useRouter();

  return (
    <Link href={href} className={[className, router.asPath !== href && inactiveClassName, router.asPath === href && activeClassName].filter(Boolean).join(' ')}>
      {children}
    </Link>
  );
}