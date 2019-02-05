param
(
    $DEPLOY_RESOURCEGROUP = "halcyon",
    $DEPLOY_LOCATION = "westeurope",
    $DEPLOY_APPSERVICEPLAN = "$DEPLOY_RESOURCEGROUP-plan",
    $DEPLOY_APPSERVICE = "$DEPLOY_RESOURCEGROUP-node-api",
    $DEPLOY_HOSTNAME = "$DEPLOY_APPSERVICE.chrispoulter.com",
    [Parameter(Mandatory = $true)]$MONGODB_URI = "",
    [Parameter(Mandatory = $true)]$JWT_SECURITYKEY = "",
    [Parameter(Mandatory = $true)]$SEED_EMAILADDRESS = "",
    [Parameter(Mandatory = $true)]$SEED_PASSWORD = "",
    [Parameter(Mandatory = $true)]$EMAIL_HOST = "",
    [Parameter(Mandatory = $true)]$EMAIL_PORT = "",
    [Parameter(Mandatory = $true)]$EMAIL_USERNAME = "",
    [Parameter(Mandatory = $true)]$EMAIL_PASSWORD = "",
    [Parameter(Mandatory = $true)]$EMAIL_NOREPLY = "",
    [Parameter(Mandatory = $true)]$FACEBOOK_APPID = "",
    [Parameter(Mandatory = $true)]$FACEBOOK_APPSECRET = "",
    [Parameter(Mandatory = $true)]$GOOGLE_CLIENTID = ""
)

Write-Host "Creating Resource Group..." -ForegroundColor Green
az group create `
    -l "$DEPLOY_LOCATION" `
    -g "$DEPLOY_RESOURCEGROUP"

Write-Host "Creating App Service Plan..." -ForegroundColor Green
az appservice plan create `
    -g "$DEPLOY_RESOURCEGROUP" `
    -l "$DEPLOY_LOCATION" `
    -n "$DEPLOY_APPSERVICEPLAN" `
    --sku "SHARED"

Write-Host "Creating Web App..." -ForegroundColor Green
az webapp create `
    -g "$DEPLOY_RESOURCEGROUP" `
    -p "$DEPLOY_APPSERVICEPLAN" `
    -n "$DEPLOY_APPSERVICE"

Write-Host "Setting Host Name..." -ForegroundColor Green
az webapp config hostname add `
    -g "$DEPLOY_RESOURCEGROUP" `
    --webapp-name "$DEPLOY_APPSERVICE" `
    --hostname "$DEPLOY_HOSTNAME"

Write-Host "Setting App Settings..." -ForegroundColor Green
az webapp config appsettings set `
    -g "$DEPLOY_RESOURCEGROUP" `
    -n "$DEPLOY_APPSERVICE" `
    --settings `
    MONGODB_URI="$MONGODB_URI" `
    JWT_SECURITYKEY="$JWT_SECURITYKEY" `
    SEED_EMAILADDRESS="$SEED_EMAILADDRESS" `
    SEED_PASSWORD="$SEED_PASSWORD" `
    EMAIL_HOST="$EMAIL_HOST" `
    EMAIL_PORT="$EMAIL_PORT" `
    EMAIL_USERNAME="$EMAIL_USERNAME" `
    EMAIL_PASSWORD="$EMAIL_PASSWORD" `
    EMAIL_NOREPLY="$EMAIL_NOREPLY" `
    FACEBOOK_APPID="$FACEBOOK_APPID" `
    FACEBOOK_APPSECRET="$FACEBOOK_APPSECRET" `
    GOOGLE_CLIENTID="$GOOGLE_CLIENTID"
