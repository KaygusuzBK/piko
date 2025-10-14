export interface TwoFactorBackupCode {
  id: string
  user_id: string
  code: string
  used: boolean
  used_at?: string
  created_at: string
}

export interface TwoFactorSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorVerification {
  token: string
  backupCode?: string
}

export interface TwoFactorStatus {
  enabled: boolean
  setup_at?: string
  backupCodesCount: number
  unusedBackupCodesCount: number
}

export interface TwoFactorSettings {
  enabled: boolean
  setup_at?: string
  backupCodes: TwoFactorBackupCode[]
  recentSessions: TwoFactorSession[]
}
