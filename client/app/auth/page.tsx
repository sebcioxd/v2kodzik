"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SignIn from '@/components/auth/sign-in'
import SignUp from '@/components/auth/sign-up'

const AuthenticationPage = () => {
  return (
    <div className='flex flex-col items-center justify-center container mx-auto lg:px-40 md:px-30 px-10 mt-5'>
      <Tabs defaultValue="sign-in" className='w-full flex flex-col items-center justify-center space-y-4'>
        <p className='text-zinc-500 text-sm animate-fade-in-01-text opacity-0'>
          Kliknij na kartę aby się zalogować lub zarejestrować.
        </p>
        <TabsList className='w-full max-w-md space-x-2 bg-transparent border-dashed border-zinc-800 relative animate-slide-in-left'>
            <TabsTrigger 
                value="sign-in" 
                className='w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                          transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                          hover:bg-zinc-800/50'
            >
                Zaloguj się
            </TabsTrigger>
            <TabsTrigger 
                value="sign-up" 
                className='w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                          transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                          hover:bg-zinc-800/50'
            >
                Zarejestruj się
            </TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in" className='w-full'>
            <SignIn />
        </TabsContent>
        <TabsContent value="sign-up" className='w-full'>
            <SignUp />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthenticationPage