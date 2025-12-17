<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Received</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px 20px;
        }
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            margin: 0 0 15px 0;
            color: #667eea;
            font-size: 18px;
        }
        .info-row {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #4b5563;
            display: inline-block;
            min-width: 100px;
        }
        .value {
            color: #111827;
        }
        .message-box {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .message-content {
            color: #4b5563;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f9fafb;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Feedback Received</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">
                🎉
            </div>
            
            <p>Hi <strong>{{ $user_name }}</strong>,</p>
            
            <p>Thank you for taking the time to share your feedback with us! We've successfully received your submission and our team will review it shortly.</p>
            
            <div class="info-box">
                <h3>Your Feedback Details</h3>
                
                <div class="info-row">
                    <span class="label">Subject:</span>
                    <span class="value"><strong>{{ $subject }}</strong></span>
                </div>
                
                <div class="info-row">
                    <span class="label">Category:</span>
                    <span class="value">{{ $category }}</span>
                </div>
                
                <div class="info-row">
                    <span class="label">Submitted:</span>
                    <span class="value">{{ $submitted_at }}</span>
                </div>
                
                <div class="info-row">
                    <span class="label">Reference ID:</span>
                    <span class="value">#{{ $feedback_id }}</span>
                </div>
            </div>
            
            <div class="message-box">
                <strong>Your Message:</strong>
                <div class="message-content">{{ $feedback_message }}</div>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul style="color: #4b5563;">
                <li>Our team will review your feedback within 24-48 hours</li>
                <li>We'll investigate and assess your submission</li>
                <li>If we need more information, we'll reach out to you</li>
                <li>You'll receive updates on the status of your feedback</li>
            </ul>
            
            <p>We appreciate your contribution to making Signa'Pal better! 🙏</p>
        </div>
        
        <div class="footer">
            <p><strong>Signa'Pal Team</strong></p>
            <p>This is an automated confirmation email</p>
            <p>If you have urgent concerns, please contact our support team</p>
        </div>
    </div>
</body>
</html>