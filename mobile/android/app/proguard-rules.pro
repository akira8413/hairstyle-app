# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep Kotlin metadata
-keepattributes *Annotation*
-keep class kotlin.Metadata { *; }

# OkHttp / HTTP client
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# Image processing
-keep class com.canhub.cropper.** { *; }
