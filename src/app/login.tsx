import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { googleWebClientId } from '@/lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const theme = useTheme();
  const { signInWithEmail, signUpWithEmail, signInWithGoogleIdToken } = useAuth();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      setError(null);
      signInWithGoogleIdToken(response.params.id_token).catch((e) => setError(e.message));
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Try again.');
    }
  }, [response, signInWithGoogleIdToken]);

  async function submitEmailForm() {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
              <ThemedText type="title" style={styles.title}>
                One Percent
              </ThemedText>
              <ThemedText themeColor="textSecondary">Get a little better, every day.</ThemedText>
            </View>

            <Card>
              <View style={styles.modeRow}>
                {(['signIn', 'signUp'] as const).map((m) => (
                  <Pressable key={m} style={styles.flex} onPress={() => setMode(m)}>
                    <View
                      style={[
                        styles.modeToggle,
                        { borderColor: m === mode ? theme.accent : theme.border },
                        m === mode && { backgroundColor: theme.accent },
                      ]}>
                      <ThemedText type="small" style={m === mode && { color: theme.accentText }}>
                        {m === 'signIn' ? 'Sign In' : 'Sign Up'}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>

              {mode === 'signUp' && (
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Name"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              )}
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error && (
                <ThemedText type="small" themeColor="warning">
                  {error}
                </ThemedText>
              )}

              <Pressable
                disabled={submitting}
                style={[styles.primaryButton, { backgroundColor: theme.accent }, submitting && styles.disabled]}
                onPress={submitEmailForm}>
                <ThemedText type="smallBold" style={{ color: theme.accentText }}>
                  {submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Create Account'}
                </ThemedText>
              </Pressable>
            </Card>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText type="small" themeColor="textSecondary">
                or
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Pressable
              disabled={!request}
              style={[styles.googleButton, { borderColor: theme.border }, !request && styles.disabled]}
              onPress={() => promptAsync()}>
              <ThemedText type="smallBold">Continue with Google</ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    gap: Spacing.one,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modeToggle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
