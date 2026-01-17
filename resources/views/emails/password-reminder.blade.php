<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #003366 0%, #002244 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{ $appName }}</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Password Reminder</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0;">Hello {{ $user->name }}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                This is a friendly reminder to log in to your account and change your password.
                            </p>
                            
                            <!-- Account Information Box -->
                            <div style="background-color: #f8f9fa; border: 2px solid #003366; border-radius: 8px; padding: 30px; margin: 30px 0;">
                                <div style="margin-bottom: 20px;">
                                    <p style="color: #003366; font-size: 14px; margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Email Address (Username)</p>
                                    <p style="color: #333333; font-size: 18px; margin: 0; font-family: 'Courier New', monospace; word-break: break-all;">{{ $email }}</p>
                                </div>
                                <div style="border-top: 1px solid #003366; padding-top: 20px;">
                                    <p style="color: #003366; font-size: 14px; margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Password</p>
                                    <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                                        Please check your previous emails for your login password. If you cannot find it, please contact the system administrator.
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <p style="color: #856404; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">⚠️ Important Reminder:</p>
                                <ul style="color: #856404; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Please log in to your account and change your password immediately for security purposes.</li>
                                    <li>Your password must meet the security requirements: at least 8 characters, with uppercase, number, and symbol.</li>
                                    <li>Do not share your password with anyone.</li>
                                </ul>
                            </div>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
                                Please use your account credentials to log in and change your password as soon as possible.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{ url('/login') }}" style="display: inline-block; background-color: #003366; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                            </div>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you have any questions or need assistance, please contact the system administrator.
                            </p>
                            
                            <p style="color: #333333; font-size: 14px; margin: 30px 0 0 0;">
                                Best regards,<br>
                                <strong>{{ $appName }} Administration</strong>
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
                                © {{ date('Y') }} {{ $appName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

