$ErrorActionPreference = "Stop"

Write-Host "Staging changes..."
git add .

$commitMessage = Read-Host "Enter commit message"
Write-Host "Committing changes..."
git commit -m $commitMessage

$pushResponse = Read-Host "Do you want to push the changes to the remote repository? (y/n)"
if ($pushResponse -eq "y") {
    git push
    Write-Host "Changes pushed to remote repository."
} else {
    Write-Host "Changes committed locally. Remember to push them to the remote repository later."
}