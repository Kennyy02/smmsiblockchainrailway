<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #003366 0%, #002244 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{ config('app.name', 'School Management System') }}</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Reset Code</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0;">Hello {{ $user->name }}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                You have requested to reset your password. Use the code below to verify your identity:
                            </p>
                            
                            <!-- OTP Code Box -->
                            <div style="background-color: #f8f9fa; border: 3px solid #003366; border-radius: 12px; padding: 40px; margin: 30px 0; text-align: center;">
                                <p style="color: #003366; font-size: 14px; margin: 0 0 15px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                                <p style="color: #003366; font-size: 48px; margin: 0; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 8px;">{{ $otp }}</p>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <p style="color: #856404; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">⚠️ Important Security Notice:</p>
                                <ul style="color: #856404; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>This code will expire in {{ $expires_in }} minutes.</li>
                                    <li>Do not share this code with anyone.</li>
                                    <li>If you did not request a password reset, please ignore this email or contact the administrator immediately.</li>
                                </ul>
                            </div>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you have any questions or need assistance, please contact the system administrator.
                            </p>
                            
                            <p style="color: #333333; font-size: 14px; margin: 30px 0 0 0;">
                                Best regards,<br>
                                <strong>Southern Mindoro Maritime School Inc.</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; font-size: 12px; margin: 5px 0;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 5px 0;">
                                © {{ date('Y') }} {{ config('app.name', 'School Management System') }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

