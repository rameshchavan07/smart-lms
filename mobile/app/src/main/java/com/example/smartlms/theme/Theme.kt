package com.example.smartlms.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = Brand100,
    secondary = Accent500,
    tertiary = Brand50,
    background = DarkSurface,
    surface = DarkSurface,
    onPrimary = TextPrimaryDark,
    onSecondary = TextPrimaryDark,
    onBackground = TextPrimaryDark,
    onSurface = TextPrimaryDark,
    error = SemanticDanger
)

private val LightColorScheme = lightColorScheme(
    primary = Brand500,
    secondary = Accent500,
    tertiary = Brand900,
    background = Surface0,
    surface = Surface1,
    onPrimary = Surface0,
    onSecondary = Surface0,
    onBackground = TextPrimaryLight,
    onSurface = TextPrimaryLight,
    error = SemanticDanger
)

@Composable
fun SmartLMSTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
