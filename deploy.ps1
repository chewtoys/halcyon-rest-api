param
(
    $DEPLOY_RESOURCEGROUP = "halcyon",
    $DEPLOY_APPSERVICE = "$DEPLOY_RESOURCEGROUP-node-api"
)

Write-Host "Building..." -ForegroundColor Green
yarn
yarn lint
yarn build
yarn --production

Write-Host "Packaging..." -ForegroundColor Green
New-Item `
    -ItemType "Directory" `
    -Path "artifacts" `
    -Force

Compress-Archive `
    -Path @("node_modules", "dist", "package.json", "web.config") `
    -DestinationPath "artifacts/Halcyon.Api.zip" `
    -CompressionLevel "Fastest" `
    -Force

Write-Host "Deploying..." -ForegroundColor Green
az webapp deployment source config-zip `
    -g "$DEPLOY_RESOURCEGROUP" `
    -n "$DEPLOY_APPSERVICE" `
    --src "artifacts/Halcyon.Api.zip"
