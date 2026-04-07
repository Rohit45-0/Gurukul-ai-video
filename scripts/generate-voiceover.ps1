param(
  [string]$VoiceName = "Microsoft David Desktop",
  [int]$Rate = 0,
  [ValidateSet("teacher", "plain")]
  [string]$Style = "teacher",
  [switch]$ListVoices
)

Add-Type -AssemblyName System.Speech

$outputDir = Join-Path $PSScriptRoot "..\public\audio"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$clips = @(
  @{
    File = "scene01-intro.wav"
    Segments = @(
      "Welcome, young scientists.",
      "In this chapter, we will see why metals shine.",
      "Why some non-metals behave differently.",
      "And how atoms react to form salts, oxides, and useful materials all around us."
    )
  },
  @{
    File = "scene02-physical.wav"
    Segments = @(
      "First, look at the physical properties of metals.",
      "Metals are lustrous, so a clean surface looks shiny.",
      "They are malleable, which means they can be beaten into sheets.",
      "They are ductile, so they can be drawn into wires.",
      "Metals also conduct heat and electricity well.",
      "And when struck, many metals make a ringing sound.",
      "That is why bells, utensils, and electric wires are often made from metals."
    )
  },
  @{
    File = "scene03-comparison.wav"
    Segments = @(
      "Non-metals are usually the opposite.",
      "Most are dull, brittle, and poor conductors.",
      "Many are gases, and a few are solids.",
      "But remember the exceptions.",
      "Iodine is a non-metal that looks shiny.",
      "Graphite conducts electricity.",
      "Gallium melts easily.",
      "And sodium and potassium are so soft that they can be cut with a knife."
    )
  },
  @{
    File = "scene04-reactivity.wav"
    Segments = @(
      "Now the fun part: chemical reactions.",
      "Magnesium burns with a dazzling white flame in oxygen.",
      "Copper turns black when heated because it forms copper oxide.",
      "Sodium and potassium react so quickly that they are stored in kerosene.",
      "With water, sodium reacts violently, calcium reacts less strongly, and iron needs steam.",
      "Metals above hydrogen also react with dilute acids to release hydrogen gas.",
      "All these observations help us build the reactivity series.",
      "From very reactive metals like potassium and sodium, down to copper, silver, and gold."
    )
  },
  @{
    File = "scene05-ionic.wav"
    Segments = @(
      "Why do metals and non-metals react so differently?",
      "The answer is electrons.",
      "Sodium has one outer electron, and chlorine needs one more electron to complete its shell.",
      "Sodium gives, chlorine takes, and both become ions.",
      "Opposite charges attract, so sodium chloride forms.",
      "Ionic compounds are usually hard, brittle, and soluble in water.",
      "They conduct electricity only when melted or dissolved, because only then can the ions move freely."
    )
  },
  @{
    File = "scene06-extraction-corrosion.wav"
    Segments = @(
      "Metals are also grouped by how they are extracted from ores.",
      "Very reactive metals, like sodium and aluminium, are obtained by electrolysis.",
      "Medium reactivity metals are first changed into oxides and then reduced.",
      "Less reactive metals can sometimes be obtained just by heating.",
      "Iron can rust, silver can tarnish, and copper can develop a green coating.",
      "We prevent corrosion by painting, oiling, galvanising, or making alloys such as brass, bronze, and stainless steel."
    )
  },
  @{
    File = "scene07-outro.wav"
    Segments = @(
      "So here is the big idea.",
      "Properties explain uses.",
      "Reactivity explains reactions.",
      "And electron transfer explains ionic compounds.",
      "With animation and voice together, this chapter can become much easier and much more fun to remember."
    )
  }
)

function Get-TeacherSsml {
  param(
    [string[]]$Segments,
    [string]$SelectedVoice,
    [string]$SelectedStyle
  )

  $prosodyRate = if ($SelectedStyle -eq "teacher") { "-4%" } else { "0%" }
  $prosodyPitch = if ($SelectedStyle -eq "teacher") { "-1st" } else { "0st" }
  $pauseTime = if ($SelectedStyle -eq "teacher") { "260ms" } else { "220ms" }

  $escapedSegments = $Segments | ForEach-Object {
    "<s>$([System.Security.SecurityElement]::Escape($_))</s>"
  }
  $body = $escapedSegments -join "<break time='$pauseTime'/>"

  return @"
<speak version='1.0' xml:lang='en-US'>
  <voice name='$([System.Security.SecurityElement]::Escape($SelectedVoice))'>
    <prosody rate='$prosodyRate' pitch='$prosodyPitch'>
      <p>$body</p>
    </prosody>
  </voice>
</speak>
"@
}

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.Rate = $Rate
$speaker.Volume = 100

$voiceNames = $speaker.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
if ($ListVoices) {
  $voiceNames | ForEach-Object { Write-Host $_ }
  $speaker.Dispose()
  return
}

if (-not ($voiceNames -contains $VoiceName)) {
  Write-Warning "Voice '$VoiceName' is not installed. Falling back to an available desktop voice."
  if ($voiceNames -contains "Microsoft David Desktop") {
    $VoiceName = "Microsoft David Desktop"
  } else {
    $VoiceName = $voiceNames[0]
  }
}
$speaker.SelectVoice($VoiceName)

$waveFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
  44100,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono
)

foreach ($clip in $clips) {
  $filePath = Join-Path $outputDir $clip.File
  $speaker.SetOutputToWaveFile($filePath, $waveFormat)
  if ($Style -eq "teacher") {
    $speaker.SpeakSsml((Get-TeacherSsml -Segments $clip.Segments -SelectedVoice $VoiceName -SelectedStyle $Style))
  } else {
    $speaker.Speak(($clip.Segments -join " "))
  }
  $speaker.SetOutputToNull()
  Write-Host "Generated $filePath"
}

$speaker.Dispose()
