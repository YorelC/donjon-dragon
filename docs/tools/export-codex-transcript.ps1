param(
    [Parameter(Mandatory = $true)]
    [string]$SessionPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

$excludedUserPrefixes = @('<recommended_plugins>', '<environment_context>')
$stream = [System.IO.File]::Open($SessionPath, 'Open', 'Read', 'ReadWrite')
$reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $true)
$sourceContent = $reader.ReadToEnd()
$reader.Dispose()

$messages = $sourceContent -split "`r?`n" | Where-Object { $_ } | ForEach-Object {
    $entry = $_ | ConvertFrom-Json
    $isMessage = $entry.type -eq 'response_item' -and $entry.payload.type -eq 'message'
    $isExchange = $entry.payload.role -in @('user', 'assistant')
    if ($isMessage -and $isExchange) {
        $text = @($entry.payload.content | ForEach-Object { $_.text }) -join "`n"
        $isInjected = $entry.payload.role -eq 'user' -and ($excludedUserPrefixes | Where-Object { $text.StartsWith($_) })
        if (-not $isInjected) {
            [pscustomobject]@{ Timestamp = $entry.timestamp; Role = $entry.payload.role; Text = $text }
        }
    }
}

$sourceBytes = [System.Text.Encoding]::UTF8.GetBytes($sourceContent)
$hashAlgorithm = [System.Security.Cryptography.SHA256]::Create()
$sessionHash = [System.BitConverter]::ToString($hashAlgorithm.ComputeHash($sourceBytes)).Replace('-', '')
$hashAlgorithm.Dispose()
$output = [System.Collections.Generic.List[string]]::new()
$output.Add('# Transcription locale du fil Codex')
$output.Add('')
$output.Add("Archive générée depuis le journal JSONL local. Elle conserve les messages utilisateur et assistant dans leur ordre original.")
$output.Add("Les instructions système, contextes techniques injectés, raisonnements internes et appels d’outils sont volontairement exclus.")
$output.Add('')
$sourceName = Split-Path -Leaf $SessionPath
$output.Add("- Source locale : ``$sourceName``")
$output.Add("- SHA-256 de la source au moment de l’export : ``$sessionHash``")
$output.Add("- Messages exportés : $($messages.Count)")
$output.Add('')

$index = 0
foreach ($message in $messages) {
    $index++
    $label = if ($message.Role -eq 'user') { 'Utilisateur' } else { 'Assistant' }
    $output.Add('---')
    $output.Add('')
    $output.Add("## Message $index — $label")
    $output.Add('')
    $output.Add("_Horodatage local du journal : $($message.Timestamp)_")
    $output.Add('')
    $output.Add($message.Text)
    $output.Add('')
}

$targetDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
$encoding = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($OutputPath, ($output -join "`n"), $encoding)
