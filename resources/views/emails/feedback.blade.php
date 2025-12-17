<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Feedback Received</title>
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
        .info-section {
            background-color: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .info-row {
            margin: 10px 0;
            padding: 8px 0;
        }
        .label {
            font-weight: 600;
            color: #667eea;
            display: inline-block;
            min-width: 120px;
        }
        .value {
            color: #333;
        }
        .message-box {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }
        .message-box h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 16px;
        }
        .message-content {
            color: #4b5563;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            opacity: 0.9;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f9fafb;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .badge-reviewed {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .badge-resolved {
            background-color: #d1fae5;
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Feedback Received</h1>
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="label">From:</span>
                    <span class="value">{{ $user_name }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">{{ $user_email }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Subject:</span>
                    <span class="value"><strong>{{ $subject }}</strong></span>
                </div>
                <div class="info-row">
                    <span class="label">Category:</span>
                    <span class="value">{{ $category }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="badge badge-{{ strtolower($status) }}">{{ $status }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Submitted:</span>
                    <span class="value">{{ $submitted_at }}</span>
                </div>
            </div>
            
            <div class="message-box">
                <h3>Feedback Message</h3>
                <div class="message-content">{{ $feedback_message }}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $view_url }}" class="button">
                    View in Admin Dashboard
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Signa'Pal Feedback System</p>
            <p>Please do not reply to this email</p>
        </div>
    </div>
</body>
</html>