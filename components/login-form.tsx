import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Github, Chrome, Sparkles } from "lucide-react"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onGitHubLogin?: () => void
  onGoogleLogin?: () => void
}

export function LoginForm({
  className,
  onGitHubLogin,
  onGoogleLogin,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#BF092F] via-purple-600 to-[#BF092F] animate-pulse" />
        
        <CardHeader className="text-center space-y-3 pt-8">
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 text-[#BF092F] animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#BF092F] to-purple-600 bg-clip-text text-transparent">
            Hoş Geldiniz
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Piko&apos;ya katılın ve düşüncelerinizi paylaşın
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form>
            <FieldGroup>
              <Field>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onGitHubLogin}
                  className="w-full border-border text-foreground hover:bg-gradient-to-r hover:from-[#BF092F] hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                >
                  <Github className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  GitHub ile Giriş Yap
                </Button>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onGoogleLogin}
                  className="w-full border-border text-foreground hover:bg-gradient-to-r hover:from-[#BF092F] hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                >
                  <Chrome className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  Google ile Giriş Yap
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                veya devam edin
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email" className="text-foreground font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                  className="border-border focus:border-[#BF092F] focus:ring-2 focus:ring-[#BF092F]/20 transition-all duration-300"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-foreground font-medium">Şifre</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-[#BF092F] transition-colors duration-200"
                  >
                    Şifrenizi mi unuttunuz?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="border-border focus:border-[#BF092F] focus:ring-2 focus:ring-[#BF092F]/20 transition-all duration-300"
                />
              </Field>
              <Field>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#BF092F] to-purple-600 hover:from-[#BF092F]/90 hover:to-purple-600/90 text-white font-semibold py-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  Giriş Yap
                </Button>
                <FieldDescription className="text-center text-muted-foreground">
                  Hesabınız yok mu? <a href="#" className="text-[#BF092F] hover:underline font-medium">Kayıt olun</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-muted-foreground text-sm">
        Devam ederek <a href="#" className="text-foreground hover:text-[#BF092F] hover:underline transition-colors duration-200">Kullanım Şartları</a>mızı ve{" "}
        <a href="#" className="text-foreground hover:text-[#BF092F] hover:underline transition-colors duration-200">Gizlilik Politikası</a>mızı kabul etmiş olursunuz.
      </FieldDescription>
    </div>
  )
}
