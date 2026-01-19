# PowerShell script to automate ngrok and Twilio webhook setup for local development
# This script will:
# 1. Start ngrok on the specified port (default: 3000)
# 2. Retrieve the public ngrok URL
# 3. Update your Twilio phone number's webhook to point to your local /api/sms/inbound endpoint
#
# Prerequisites:
# - ngrok installed and available in PATH
# - Twilio CLI installed and authenticated, or set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER as environment variables

param(
    [int]$Port = 3000,
    [string]$TwilioPhoneNumber = $env:TWILIO_PHONE_NUMBER,
    [string]$TwilioAccountSid = $env:TWILIO_ACCOUNT_SID,
    [string]$TwilioAuthToken = $env:TWILIO_AUTH_TOKEN
)

function Start-Ngrok {
    Write-Host "Starting ngrok on port $Port..."
    Start-Process ngrok "http $Port" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

function Get-NgrokUrl {
    $apiUrl = "http://127.0.0.1:4040/api/tunnels"
    $response = Invoke-RestMethod -Uri $apiUrl -ErrorAction Stop
    $publicUrl = $response.tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -First 1 -ExpandProperty public_url
    return $publicUrl
}

function Update-TwilioWebhook {
    param(
        [string]$WebhookUrl
    )
    if ($TwilioAccountSid -and $TwilioAuthToken -and $TwilioPhoneNumber) {
        Write-Host "Updating Twilio webhook to $WebhookUrl..."
        $twilioApiUrl = "https://api.twilio.com/2010-04-01/Accounts/$TwilioAccountSid/IncomingPhoneNumbers.json"
        $numbers = Invoke-RestMethod -Uri $twilioApiUrl -Credential (New-Object System.Management.Automation.PSCredential($TwilioAccountSid, (ConvertTo-SecureString $TwilioAuthToken -AsPlainText -Force)))
        $phone = $numbers.incoming_phone_numbers | Where-Object { $_.phone_number -eq $TwilioPhoneNumber }
        if ($phone) {
            $sid = $phone.sid
            $updateUrl = "https://api.twilio.com/2010-04-01/Accounts/$TwilioAccountSid/IncomingPhoneNumbers/$sid.json"
            $body = @{ SmsUrl = "$WebhookUrl/api/sms/inbound" }
            Invoke-RestMethod -Method Post -Uri $updateUrl -Credential (New-Object System.Management.Automation.PSCredential($TwilioAccountSid, (ConvertTo-SecureString $TwilioAuthToken -AsPlainText -Force))) -Body $body
            Write-Host "Twilio webhook updated successfully."
        } else {
            Write-Host "Could not find Twilio phone number $TwilioPhoneNumber."
        }
    } else {
        Write-Host "Twilio credentials or phone number not set. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER as environment variables."
    }
}

# Main script
Start-Ngrok
$ngrokUrl = Get-NgrokUrl
if ($ngrokUrl) {
    Write-Host "ngrok public URL: $ngrokUrl"
    Update-TwilioWebhook -WebhookUrl $ngrokUrl
    Write-Host "Local development webhook setup complete."
} else {
    Write-Host "Failed to retrieve ngrok public URL. Is ngrok running?"
}
