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
import { Github, Chrome } from "lucide-react"

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
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Hoş Geldiniz</CardTitle>
          <CardDescription>
            GitHub veya Google hesabınızla giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onGitHubLogin}
                  className="w-full"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub ile Giriş Yap
                </Button>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onGoogleLogin}
                  className="w-full"
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Google ile Giriş Yap
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                veya devam edin
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Şifre</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Şifrenizi mi unuttunuz?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Giriş Yap</Button>
                <FieldDescription className="text-center">
                  Hesabınız yok mu? <a href="#">Kayıt olun</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Devam ederek <a href="#">Kullanım Şartları</a>mızı ve{" "}
        <a href="#">Gizlilik Politikası</a>mızı kabul etmiş olursunuz.
      </FieldDescription>
    </div>
  )
}
