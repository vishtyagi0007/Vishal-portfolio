# Run from the extracted website folder in PowerShell.
# Deploys to the EXISTING vishal-portfolio project; user logs in to their Vercel account.
Set-Location -LiteralPath $PSScriptRoot
npx vercel login
if ($LASTEXITCODE -ne 0) { throw 'Vercel login failed. Nothing was deployed.' }
npx vercel link --yes --project vishal-portfolio --scope vishtyagi0007s-projects
if ($LASTEXITCODE -ne 0) { throw 'Could not link existing Vercel project. Nothing was deployed.' }
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) { throw 'Production deployment failed. Check Vercel output.' }
Write-Host 'Deployment command finished. Check https://vishal-portfolio-bay.vercel.app/'
