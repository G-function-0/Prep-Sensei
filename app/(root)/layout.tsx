import { getCurrentUser } from '@/lib/auth.action'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic';

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');

  return (
    <div className='root-layout'>
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={38} height={32} />
          <h2 className='text-primary-100'>PrepSensei</h2>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-light-100 max-sm:hidden">
            {user.name}
          </span>
          <SignOutButton />
        </div>
      </nav>

      {children}
    </div>
  )
}

export default RootLayout