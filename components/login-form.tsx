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
import { Github, Chrome, Sparkles, Loader2 } from "lucide-react"
import { useState } from "react"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onGitHubLogin?: () => void
  onGoogleLogin?: () => void
  onEmailLogin?: (email: string, password: string) => Promise<{ error: Error | null }>
  onEmailSignup?: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  onResetPassword?: (email: string) => Promise<{ error: Error | null }>
}

export function LoginForm({
  className,
  onGitHubLogin,
  onGoogleLogin,
  onEmailLogin,
  onEmailSignup,
  onResetPassword,
  ...props
}: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Lütfen e-posta adresinizi girin")
      return
    }
    
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await onResetPassword?.(email)
      if (result?.error) {
        setError(result.error.message || "Şifre sıfırlama başarısız oldu")
      } else {
        setSuccess("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.")
        setShowResetPassword(false)
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validate display name for signup
    if (isSignUp && !displayName.trim()) {
      setError("Lütfen adınızı girin")
      return
    }
    
    setLoading(true)

    try {
      if (isSignUp) {
        const result = await onEmailSignup?.(email, password, displayName)
        if (result?.error) {
          setError(result.error.message || "Kayıt başarısız oldu")
        } else {
          setSuccess("Kayıt başarılı! Lütfen e-posta adresinizi kontrol edin ve hesabınızı doğrulayın.")
        }
      } else {
        const result = await onEmailLogin?.(email, password)
        if (result?.error) {
          setError(result.error.message || "Giriş başarısız oldu")
        } else {
          setSuccess("Giriş başarılı! Yönlendiriliyorsunuz...")
        }
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }
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
            {isSignUp ? "Hesap Oluştur" : "Hoş Geldiniz"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            {isSignUp ? "SOC AI'ya katılın ve düşüncelerinizi paylaşın" : "Hesabınıza giriş yapın"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
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
              {isSignUp && (
                <Field>
                  <FieldLabel htmlFor="displayName" className="text-foreground font-medium">Adınız</FieldLabel>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Adınız Soyadınız"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    className="border-border focus:border-[#BF092F] focus:ring-2 focus:ring-[#BF092F]/20 transition-all duration-300"
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email" className="text-foreground font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="border-border focus:border-[#BF092F] focus:ring-2 focus:ring-[#BF092F]/20 transition-all duration-300"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-foreground font-medium">Şifre</FieldLabel>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-[#BF092F] transition-colors duration-200"
                    >
                      Şifrenizi mi unuttunuz?
                    </button>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  className="border-border focus:border-[#BF092F] focus:ring-2 focus:ring-[#BF092F]/20 transition-all duration-300"
                />
                {isSignUp && (
                  <FieldDescription className="text-xs text-muted-foreground">
                    En az 6 karakter olmalıdır
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#BF092F] to-purple-600 hover:from-[#BF092F]/90 hover:to-purple-600/90 text-white font-semibold py-6 transform hover:scale-105 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isSignUp ? "Kayıt Olunuyor..." : "Giriş Yapılıyor..."}
                    </>
                  ) : (
                    isSignUp ? "Kayıt Ol" : "Giriş Yap"
                  )}
                </Button>
                <FieldDescription className="text-center text-muted-foreground">
                  {isSignUp ? "Zaten hesabınız var mı? " : "Hesabınız yok mu? "}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError("")
                      setSuccess("")
                      setDisplayName("")
                    }}
                    className="text-[#BF092F] hover:underline font-medium"
                  >
                    {isSignUp ? "Giriş yapın" : "Kayıt olun"}
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          
          {/* Password Reset Form */}
          {showResetPassword && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Şifre Sıfırlama</h3>
              <p className="text-sm text-muted-foreground mb-4">
                E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Şifre Sıfırlama Bağlantısı Gönder"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false)
                    setError("")
                    setSuccess("")
                  }}
                  disabled={loading}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-muted-foreground text-sm">
        Devam ederek <a href="#" className="text-foreground hover:text-[#BF092F] hover:underline transition-colors duration-200">Kullanım Şartları</a>mızı ve{" "}
        <a href="#" className="text-foreground hover:text-[#BF092F] hover:underline transition-colors duration-200">Gizlilik Politikası</a>mızı kabul etmiş olursunuz.
      </FieldDescription>
    </div>
  )
}
