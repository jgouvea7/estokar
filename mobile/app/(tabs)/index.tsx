import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoAuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bug,
  Boxes,
  Box,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  FileText,
  Flame,
  History,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Receipt,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  Users,
  X,
  XCircle,
  Zap,
  ChartBar,
  TrendingDown,
  TrendingUp
} from 'lucide-react-native';
import { ComponentType, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createCategory,
  deleteCategory,
  getCategories as fetchCategories,
  updateCategory,
} from '@/src/shared/api/categories';
import {
  createProduct as createRemoteProduct,
  deleteProduct as deleteRemoteProduct,
  getProductDetails,
  updateProduct as updateRemoteProduct,
} from '@/src/shared/api/products';
import { getGoogleOAuthUrl, getProfile, login, register } from '@/src/shared/api/auth';
import { deleteMyAccount, updateUser } from '@/src/shared/api/users';
import {
  clearSession,
  clearLocalInventoryData,
  createLocalProduct,
  deleteLocalProduct,
  getLocalProducts,
  getSession,
  getStockMovements,
  initializeLocalDb,
  moveLocalStock,
  saveSession,
  updateLocalProduct,
} from '@/src/shared/storage/local-db';
import { syncProducts } from '@/src/shared/sync/products-sync';
import { isLocalImageUri, removeSupabaseImage, uploadProductImageFromUri } from '@/src/shared/utils/images';
import type {
  AuthSession,
  Category,
  CreateProductPayload,
  Product,
  ProductDetailsResponse,
  StockMovement,
  UserRole,
} from '@/src/shared/types/domain';

type AuthMode = 'login' | 'register';
type AppSection = 'home' | 'products' | 'history' | 'profile' | 'settings' | 'terms' | 'privacy' | 'about';
type LocalProductInput = CreateProductPayload & { categoryName?: string };
const NO_PHOTO_IMAGE = 'sem-foto';

WebBrowser.maybeCompleteAuthSession();

const theme = {
  accent: '#3b82f6',
  accentSoft: '#eff6ff',
  bg: '#f5f7fb',
  card: '#ffffff',
  critical: '#ef4444',
  criticalSoft: '#fee2e2',
  ink: '#0f172a',
  low: '#f59e0b',
  lowSoft: '#fef3c7',
  muted: '#64748b',
  ok: '#10b981',
  okSoft: '#d1fae5',
  soft: '#f1f5f9',
  stroke: '#e2e8f0',
  surface: '#f8fafc',
  surface2: '#f8fafc',
  brandGradient: ['#0b1220', '#101d33', '#1f3a70'] as const,
};

const APP_ICON_MAP = {
  'add': Plus,
  'alert-circle-outline': AlertCircle,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'camera-outline': Camera,
  'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight,
  'close': X,
  'close-circle-outline': XCircle,
  'create-outline': Pencil,
  'cube': Boxes,
  'cube-outline': Box,
  'circle-user-round': CircleUserRound,
  'eye-off-outline': EyeOff,
  'eye-outline': Eye,
  'file-text-outline': FileText,
  'flame-outline': Flame,
  'grid-outline': LayoutGrid,
  'history': History,
  'image-outline': ImageIcon,
  'information-circle-outline': Info,
  'log-in-outline': LogIn,
  'log-out-outline': LogOut,
  'menu': Menu,
  'people-outline': Users,
  'person-outline': User,
  'phone-portrait-outline': Smartphone,
  'receipt-outline': Receipt,
  'search': Search,
  'settings-outline': Settings,
  'shield-checkmark-outline': ShieldCheck,
  'smartphone-outline': Smartphone,
  'trash-outline': Trash2,
  'flash-outline': Zap,
  'chart-bar': ChartBar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
} as const;

type AppIconName = keyof typeof APP_ICON_MAP;

function AppIcon({
  name,
  size = 20,
  color = theme.ink,
  strokeWidth = 2,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Icon = APP_ICON_MAP[name] as ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;

  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isRegister = mode === 'register';

  useEffect(() => {
    async function boot() {
      await initializeLocalDb();
      const storedSession = await getSession();
      setSession(storedSession);
      if (storedSession?.user) {
        Sentry.setUser({
          id: storedSession.user.id,
          email: storedSession.user.email,
        });
      } else {
        Sentry.setUser(null);
      }
      setBooting(false);
    }

    boot();
  }, []);

  async function handleAuth() {
    setAuthLoading(true);
    setAuthMessage('');

    try {
      if (isRegister) {
        await register({ email, name, password });
      }

      const nextSession = await login({ email, password });
      await saveSession(nextSession);
      setSession(nextSession);
      Sentry.setUser({
        id: nextSession.user.id,
        email: nextSession.user.email,
      });
    } catch (error) {
      const storedSession = await getSession();
      if (storedSession) {
        setSession(storedSession);
        if (storedSession.user) {
          Sentry.setUser({
            id: storedSession.user.id,
            email: storedSession.user.email,
          });
        }
        setAuthMessage('Sem conexao. Abrindo dados salvos no aparelho.');
      } else {
        setAuthMessage(error instanceof Error ? error.message : 'Nao foi possivel entrar.');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await clearSession();
    setSession(null);
    Sentry.setUser(null);
  }

  async function handleDeleteAccount() {
    if (!session) return;

    await deleteMyAccount(session.accessToken);
    await clearLocalInventoryData();
    await clearSession();
    setSession(null);
    Sentry.setUser(null);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setAuthMessage('');

    try {
      const redirectUri = ExpoAuthSession.makeRedirectUri();
      const authUrl = getGoogleOAuthUrl(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);


      if (result.type !== 'success' || !result.url) {
        setAuthMessage('Login com Google cancelado.');
        return;
      }

      const parsed = Linking.parse(result.url);
      const accessToken =
        typeof parsed.queryParams?.accessToken === 'string'
          ? parsed.queryParams.accessToken
          : '';

      const refreshToken =
        typeof parsed.queryParams?.refreshToken === 'string'
          ? parsed.queryParams.refreshToken
          : '';


      if (!accessToken) {
        throw new Error('Nao foi possivel concluir o login com Google.');
      }

      const roleFromQuery: UserRole =
        typeof parsed.queryParams?.role === 'string' && parsed.queryParams.role === 'ADMIN'
          ? 'ADMIN'
          : 'FREE';

      const fallbackUser = {
        email: typeof parsed.queryParams?.email === 'string' ? parsed.queryParams.email : '',
        id: typeof parsed.queryParams?.id === 'string' ? parsed.queryParams.id : '',
        name: typeof parsed.queryParams?.name === 'string' ? parsed.queryParams.name : 'Usuario',
        role: roleFromQuery,
        createdAt: typeof parsed.queryParams?.createdAt === 'string'
          ? parsed.queryParams.createdAt
          : new Date().toISOString(),
        alertDaysBefore: typeof parsed.queryParams?.alertDaysBefore === 'string'
          ? Number(parsed.queryParams.alertDaysBefore)
          : undefined,
      };

      const profile = await getProfile(accessToken).catch(() => fallbackUser);
      const nextSession: AuthSession = {
        accessToken,
        refreshToken,
        user: {
          email: profile.email || fallbackUser.email,
          id: profile.id || fallbackUser.id,
          name: profile.name || fallbackUser.name,
          role: profile.role ?? fallbackUser.role,
          createdAt: profile.createdAt || fallbackUser.createdAt,
          alertDaysBefore: profile.alertDaysBefore ?? fallbackUser.alertDaysBefore,
        },
      };

      await saveSession(nextSession);
      setSession(nextSession);
      Sentry.setUser({
        id: nextSession.user.id,
        email: nextSession.user.email,
      });
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? error.message : 'Nao foi possivel entrar com Google.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <View style={styles.loadingScreen}>
          <AppLogo size={74} />
          <Text style={styles.loadingText}>Estokar</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSessionUpdate(nextSession: AuthSession) {
    await saveSession(nextSession);
    setSession(nextSession);
  }

  if (session) {
    return (
      <DashboardScreen
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        onSessionUpdate={handleSessionUpdate}
        session={session}
      />
    );
  }

  return (
    <SafeAreaView style={styles.authSafeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.authContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <View style={styles.authBrandRow}>
                <View style={styles.authBrandIcon}>
                  <AppIcon name="cube" size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.authBrandText}>
                  <Text style={styles.authBrandEyebrow}>ESTOKAR</Text>
                  <Text style={styles.authBrandTitle}>Inventory OS</Text>
                </View>
              </View>
            </View>

            {isRegister ? (
              <PremiumInput label="Nome" onChangeText={setName} placeholder="Seu nome" value={name} />
            ) : null}
            <PremiumInput
              autoCapitalize="none"
              keyboardType="email-address"
              label="E-mail"
              onChangeText={setEmail}
              placeholder="voce@email.com"
              value={email}
            />

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Senha</Text>
                {!isRegister ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => Alert.alert('Recuperar senha', 'Funcionalidade em breve.')}
                    style={({ pressed }) => [styles.forgotLinkButton, pressed && styles.pressed]}>
                    <Text style={styles.forgotLink}>Esqueceu a senha?</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.passwordField}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPassword((current) => !current)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                  <AppIcon
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={theme.ink}
                  />
                </Pressable>
              </View>
            </View>

            {isRegister ? (
              <PremiumInput label="Confirmar senha" placeholder="Repita a senha" secureTextEntry />
            ) : null}
            {authMessage ? <Text style={styles.authMessage}>{authMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={authLoading}
              onPress={handleAuth}
              style={({ pressed }) => [
                styles.primaryButton,
                authLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <LinearGradient
                colors={theme.brandGradient}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>
                  {authLoading ? 'Conectando...' : isRegister ? 'Criar conta' : 'Entrar na conta'}
                </Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.authDivider}>
              <View style={styles.authDividerLine} />
              <Text style={styles.authDividerText}>Ou continue com</Text>
              <View style={styles.authDividerLine} />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={googleLoading}
              onPress={handleGoogleLogin}
              style={({ pressed }) => [
                styles.googleButton,
                googleLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              {googleLoading ? (
                <Text style={styles.googleButtonText}>Conectando Google...</Text>
              ) : (
                <View style={styles.googleBrand}>
                  <Text style={styles.googleMark}>G</Text>
                  <Text style={styles.googleButtonText}>Google</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.authFooter}>
              <Text style={styles.authFooterText}>
                {isRegister ? 'Ja tem uma conta?' : 'Nao tem uma conta?'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMode(isRegister ? 'login' : 'register')}
                style={({ pressed }) => [
                  styles.authFooterAction,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.authFooterActionText}>
                  {isRegister ? 'Entrar' : 'Crie uma agora'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DashboardScreen({
  onDeleteAccount,
  onLogout,
  onSessionUpdate,
  session,
}: {
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  onSessionUpdate: (nextSession: AuthSession) => Promise<void>;
  session: AuthSession;
}) {
  const [section, setSection] = useState<AppSection>('home');
  const [settingsSubMenu, setSettingsSubMenu] = useState<'main' | 'stock' | 'legal'>('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const insights = useMemo(
    () => getInventoryInsights(products, movements, session.user.alertDaysBefore ?? 7),
    [products, movements, session.user.alertDaysBefore],
  );

  const refreshLocalState = useCallback(async () => {
    setProducts(await getLocalProducts());
    setMovements(await getStockMovements());
  }, []);

  const refreshProducts = useCallback(async () => {
    const result = await syncProducts(session);
    setProducts(result.products);
    setMovements(await getStockMovements());
  }, [session]);

  const refreshCategories = useCallback(async () => {
    try {
      const apiCategories = await fetchCategories(session.accessToken);
      setCategories(apiCategories);
    } catch {
      setCategories((currentCategories) => currentCategories);
    }
  }, [session.accessToken]);

  useEffect(() => {
    async function load() {
      await refreshLocalState();
      await refreshCategories();
      await refreshProducts();
    }

    load();
  }, [refreshCategories, refreshLocalState, refreshProducts]);

  async function handleCreateProduct(input: LocalProductInput) {
    try {
      await createRemoteProduct(session.accessToken, input);
    } catch {
      await createLocalProduct(input);
    } finally {
      await refreshProducts();
    }
  }

  async function handleUpdateProduct(product: Product, input: LocalProductInput) {
    try {
      if (product.remoteId) {
        await updateRemoteProduct(session.accessToken, product.remoteId, input);
      } else {
        throw new Error('Produto ainda não sincronizado.');
      }
    } catch {
      await updateLocalProduct(product, input);
    } finally {
      await refreshProducts();
    }
  }

  async function handleDeleteProduct(product: Product) {
    try {
      if (product.remoteId) {
        await deleteRemoteProduct(session.accessToken, product.remoteId);
      } else {
        await deleteLocalProduct(product);
      }
    } catch {
      await deleteLocalProduct(product);
    } finally {
      await refreshProducts();
    }
  }

  async function handleMoveStock(product: Product, type: StockMovement['type'], quantity: number) {
    if (quantity <= 0) return;

    try {
      await moveLocalStock(product, type, quantity);
      await refreshProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar o estoque.';
      Alert.alert('Erro ao movimentar estoque', message);
    }
  }

  async function handleCreateCategory(name: string) {
    const createdCategory = await createCategory(session.accessToken, name);
    setCategories((currentCategories) => {
      if (currentCategories.some((category) => category.id === createdCategory.id)) {
        return currentCategories;
      }

      return [...currentCategories, createdCategory].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    });

    await refreshCategories();
  }

  async function handleUpdateCategory(category: Category, name: string) {
    try {
      await updateCategory(session.accessToken, category.id, name);
      await refreshCategories();
      await refreshProducts();
    } catch (error) {
      await refreshCategories();
      throw error;
    }
  }

  async function handleDeleteCategory(category: Category) {
    try {
      await deleteCategory(session.accessToken, category.id);
      await refreshCategories();
      await refreshProducts();
    } catch (error) {
      await refreshCategories();
      throw error;
    }
  }

  function navigate(nextSection: AppSection) {
    setSection(nextSection);
    setSidebarOpen(false);
  }

  async function handleSaveAlertDays(nextValue: number) {
    const updatedProfile = await updateUser(
      session.user.id,
      { alertDaysBefore: nextValue },
      session.accessToken,
    );

    const nextSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        ...updatedProfile,
        alertDaysBefore: updatedProfile.alertDaysBefore ?? nextValue,
      },
    };

    await onSessionUpdate(nextSession);
  }

  return (
    <SafeAreaView style={styles.appSafeArea}>
      <View style={styles.appShell}>
        <View style={styles.appHeader}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSidebarOpen(true)}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}>
            <AppIcon name="menu" size={25} color={theme.ink} />
          </Pressable>
          <View>
            <Text style={styles.headerEyebrow}>Estokar</Text>
            <Text style={styles.headerTitle}>{getSectionTitle(section)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate('profile')}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.buttonPressed]}>
            <Text style={styles.avatarText}>{getInitial(session.user.name)}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {section === 'home' ? (
            <HomeSection
              insights={insights}
              movements={movements}
              onNavigate={navigate}
            />
          ) : null}
          {section === 'products' ? (
            <ProductsSection
              accessToken={session.accessToken}
              fallbackAlertDays={session.user.alertDaysBefore ?? 7}
              categories={categories}
              onNavigate={navigate}
              onCreateCategory={handleCreateCategory}
              onCreateProduct={handleCreateProduct}
              onDeleteCategory={handleDeleteCategory}
              onDeleteProduct={handleDeleteProduct}
              onMoveStock={handleMoveStock}
              onUpdateCategory={handleUpdateCategory}
              onUpdateProduct={handleUpdateProduct}
              products={products}
              userId={session.user.id}
            />
          ) : null}
          {section === 'history' ? (
            <HistorySection movements={movements} />
          ) : null}
          {section === 'profile' ? (
            <ProfileSection
              onDeleteAccount={onDeleteAccount}
              onLogout={onLogout}
              user={session.user}
            />
          ) : null}
          {section === 'settings' ? (
            <SettingsSection
              alertDaysBefore={session.user.alertDaysBefore ?? 7}
              subMenu={settingsSubMenu}
              onSubMenuChange={setSettingsSubMenu}
              onNavigate={navigate}
              onSaveAlertDays={handleSaveAlertDays}
            />
          ) : null}
          {section === 'terms' ? (
            <TermsSection onBack={() => navigate('settings')} />
          ) : null}
          {section === 'privacy' ? (
            <PrivacySection onBack={() => navigate('settings')} />
          ) : null}
          {section === 'about' ? (
            <AboutSection onBack={() => navigate('settings')} />
          ) : null}
        </ScrollView>

        {sidebarOpen ? (
          <View style={styles.sidebarLayer}>
            <Pressable onPress={() => setSidebarOpen(false)} style={styles.sidebarBackdrop} />
            <LinearGradient
              colors={theme.brandGradient}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.sidebar}>
              <View style={styles.sidebarBrand}>
                <View style={styles.sidebarLogo}>
                  <AppIcon name="cube" size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View style={styles.sidebarBrandText}>
                  <Text style={styles.sidebarEyebrow}>ESTOKAR</Text>
                  <Text style={styles.sidebarTitle}>Inventory OS</Text>
                </View>
              </View>
              <View style={styles.sidebarNav}>
                <SidebarItem active={section === 'home'} icon="grid-outline" label="Inicio" onPress={() => navigate('home')} />
                <SidebarItem active={section === 'products'} icon="cube-outline" label="Produtos" onPress={() => navigate('products')} />
                <SidebarItem active={section === 'history'} icon="history" label="Historico" onPress={() => navigate('history')} />
                <SidebarItem active={section === 'profile'} icon="circle-user-round" label="Perfil" onPress={() => navigate('profile')} />
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ marginBottom: 16 }}>
                <SidebarItem active={section === 'settings'} icon="settings-outline" label="Configuracoes" onPress={() => { navigate('settings'); setSettingsSubMenu('main'); }} />
              </View>
            </LinearGradient>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function HomeSection({
  insights,
  movements,
  onNavigate,
}: {
  insights: InventoryInsights;
  movements: StockMovement[];
  onNavigate: (section: AppSection) => void;
}) {
  const weeklyTone =
    insights.weeklySales.direction === 'up'
      ? 'green'
      : insights.weeklySales.direction === 'down'
        ? 'red'
        : 'slate';
  const weeklyIcon = insights.weeklySales.direction === 'up' ? 'trending-up' : 'trending-down';
  const dailyTone = insights.dailyBalance > 0 ? 'green' : insights.dailyBalance < 0 ? 'red' : 'slate';
  const dailyIcon = insights.dailyBalance >= 0 ? 'trending-up' : 'trending-down';

  return (
    <View style={styles.section}>
      <LinearGradient
        colors={theme.brandGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.heroPanel}>
        <View style={styles.heroGlowPrimary} />
        <View style={styles.heroGlowSecondary} />
        <View style={styles.heroBadge}>
          <AppIcon name="chart-bar" size={12} color="#c7d2fe" />
          <Text style={styles.heroBadgeText}>Painel principal</Text>
        </View>
        <Text style={styles.heroTitle}>Dashboard operacional em tempo real.</Text>
        <Text style={styles.heroSubtitle}>
          Vendas, previsoes de estoque e movimentacoes recentes em uma visao unica para o time.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate('products')}
          style={({ pressed }) => [styles.heroButton, pressed && styles.buttonPressed]}>
          <View style={styles.heroButtonInner}>
            <AppIcon name="cube" size={18} color="#ffffff" />
            <Text style={styles.heroButtonText}>Ver produtos</Text>
          </View>
        </Pressable>
      </LinearGradient>

      <View style={styles.metricsGridTwo}>
        <MetricCard icon="cube" label="Estoque total" value={formatNumber(insights.totalStock)} color="blue" />
        <MetricCard
          icon="chart-bar"
          label="Disponibilidade de catalogo"
          value={`${Math.round(insights.catalogAvailability)}%`}
          color="orange"
          helperText="SKUs com saldo positivo"
        />
      </View>

      <View style={styles.metricsGridTwo}>
        <MetricCard
          icon={weeklyIcon}
          label="Vendas semanais"
          value={insights.weeklySales.valueLabel}
          color={weeklyTone}
          helperText={insights.weeklySales.comparisonLabel}
        />
        <MetricCard
          icon={dailyIcon}
          label="Balanco diario"
          value={`${insights.dailyBalance > 0 ? '+' : ''}${formatNumber(insights.dailyBalance)}`}
          color={dailyTone}
          helperText="Saldo liquido de hoje"
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Movimentacoes recentes</Text>
            <Text style={styles.cardSubtitle}>Ultimos eventos de entrada e saida no inventario.</Text>
          </View>
        </View>
        <MovementPanel compact movements={movements} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Produtos mais vendidos</Text>
            <Text style={styles.cardSubtitle}>Ranking por volume total.</Text>
          </View>
          <AppIcon name="flame-outline" size={18} color={theme.accent} />
        </View>
        <TopSellingList items={insights.topSellingProducts} />
      </View>

      {insights.topCategories.length ? (
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Categorias populares</Text>
              <Text style={styles.cardSubtitle}>Top categorias por saida.</Text>
            </View>
            <AppIcon name="receipt-outline" size={18} color={theme.accent} />
          </View>
          <TopCategoryList items={insights.topCategories} />
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Alertas de reposicao.</Text>
            <Text style={styles.cardSubtitle}>Conforme prazos definidos.</Text>
          </View>
          <AppIcon name="alert-circle-outline" size={18} color={theme.low} />
        </View>
        <LowStockList items={insights.lowStockProducts} />
      </View>
    </View>
  );
}

function ProductsSection({
  accessToken,
  fallbackAlertDays,
  categories,
  onNavigate,
  onCreateCategory,
  onCreateProduct,
  onDeleteCategory,
  onDeleteProduct,
  onMoveStock,
  onUpdateCategory,
  onUpdateProduct,
  products,
  userId,
}: {
  accessToken: string;
  fallbackAlertDays: number;
  categories: Category[];
  onNavigate: (section: AppSection) => void;
  onCreateCategory: (name: string) => Promise<void>;
  onCreateProduct: (product: LocalProductInput) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  onDeleteProduct: (product: Product) => Promise<void>;
  onMoveStock: (product: Product, type: StockMovement['type'], quantity: number) => Promise<void>;
  onUpdateCategory: (category: Category, name: string) => Promise<void>;
  onUpdateProduct: (product: Product, input: LocalProductInput) => Promise<void>;
  products: Product[];
  userId: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [detailsData, setDetailsData] = useState<ProductDetailsResponse | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryActionVisible, setCategoryActionVisible] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [form, setForm] = useState({
    categoryId: '',
    categoryName: '',
    description: '',
    image: '',
    name: '',
    quantity: '',
  });
  const [categoryDraft, setCategoryDraft] = useState('');

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase());
      const productCategory =
        product.category?.name ??
        product.categoryName ??
        categories.find((category) => category.id === product.categoryId)?.name ??
        'Sem categoria';
      const matchesCategory = categoryFilter === 'Todos' || productCategory === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [categories, categoryFilter, products, query]);

  useEffect(() => {
    const categoryNames = new Set(categories.map((category) => category.name));
    if (categoryFilter !== 'Todos' && !categoryNames.has(categoryFilter)) {
      setCategoryFilter('Todos');
    }

    const selectedCategoryExists = categories.some((category) => category.id === form.categoryId);
    if (!selectedCategoryExists && form.categoryId) {
      setForm((current) => ({
        ...current,
        categoryName: 'Sem categoria',
        categoryId: '',
      }));
    }
  }, [categories, categoryFilter, form.categoryId]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingProduct(null);
    setForm({
      categoryId: '',
      categoryName: '',
      description: '',
      image: '',
      name: '',
      quantity: '',
    });
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    const categoryName = product.category?.name ?? product.categoryName ?? '';
    setForm({
      categoryId: product.categoryId ?? categories.find((category) => category.name === categoryName)?.id ?? '',
      categoryName,
      description: product.description,
      image: product.image === NO_PHOTO_IMAGE ? '' : product.image,
      name: product.name,
      quantity: String(product.quantity),
    });
    setModalVisible(true);
  }

  async function openDetailsModal(product: Product) {
    setDetailsVisible(true);
    setDetailsLoading(true);
    setDetailsError('');
    setDetailsProduct(product);
    setDetailsData(null);

    const remoteId = product.remoteId ?? product.id;

    try {
      if (remoteId.startsWith('local-')) {
        throw new Error('Produto local ainda nao sincronizado.');
      }

      const data = await getProductDetails(remoteId, accessToken);
      setDetailsData(data);
    } catch {
      const movements = await getStockMovements();
      const recentMovements = movements.filter((movement) => movement.productId === product.id);

      setDetailsData({
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          categoryId: product.categoryId ?? null,
          category: product.category ?? null,
        },
        dashboard: {
          alertDaysBefore: product.alertDaysBefore ?? fallbackAlertDays,
          currentStock: product.quantity,
          averageDailySales: 0,
          estimatedDaysLeft: null,
          recentMovements,
          summary: {
            totalEntries: recentMovements.filter((m) => m.type === 'in').reduce((total, m) => total + m.quantity, 0),
            totalOutputs: recentMovements.filter((m) => m.type === 'out').reduce((total, m) => total + m.quantity, 0),
          },
        },
      });
      setDetailsError('Exibindo dados locais.');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function pickProductImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateForm('image', result.assets[0].uri);
      setImageModalVisible(false);
    }
  }

  async function takeProductPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateForm('image', result.assets[0].uri);
      setImageModalVisible(false);
    }
  }

  async function handleSaveProduct() {
    const parsedQuantity = Number(form.quantity);
    const categoryName =
      form.categoryName.trim() ||
      categories.find((category) => category.id === form.categoryId)?.name ||
      'Sem categoria';

    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(parsedQuantity)) {
      return;
    }

    let image = form.image || NO_PHOTO_IMAGE;

    if (image && isLocalImageUri(image)) {
      try {
        setIsImageUploading(true);
        const previousImage = editingProduct?.image;
        image = await uploadProductImageFromUri(image, userId);
        setForm((current) => ({ ...current, image }));

        if (previousImage && previousImage !== NO_PHOTO_IMAGE && previousImage !== image) {
          await removeSupabaseImage(previousImage);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nao foi possivel enviar a imagem.';
        Alert.alert('Erro ao enviar imagem', message);
        return;
      } finally {
        setIsImageUploading(false);
      }
    }

    const input: LocalProductInput = {
      categoryId: form.categoryId ? form.categoryId : null,
      categoryName,
      description: form.description.trim(),
      image,
      name: form.name.trim(),
      quantity: Math.max(Math.trunc(parsedQuantity), 0),
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct, input);
    } else {
      await onCreateProduct(input);
    }

    resetForm();
    setModalVisible(false);
  }


  async function handleDeleteProduct() {
    if (!editingProduct) return;
    const productToDelete = editingProduct;

    resetForm();
    setModalVisible(false);

    try {
      await onDeleteProduct(productToDelete);
    } catch {
      // The product is already removed optimistically when possible; avoid an unhandled native promise.
    }
  }

  async function handleSaveCategory() {
    const name = categoryDraft.trim();
    if (!name) return;

    try {
      if (categoryMode === 'edit' && selectedCategory) {
        await onUpdateCategory(selectedCategory, name);
        Alert.alert('Categoria atualizada', 'A categoria foi atualizada com sucesso.');
      } else {
        await onCreateCategory(name);
        Alert.alert('Categoria criada', 'A categoria foi criada com sucesso.');
      }
      setCategoryModalVisible(false);
      setCategoryDraft('');
      setSelectedCategory(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel salvar a categoria.';
      Alert.alert('Erro ao salvar categoria', message);
    }
  }

  function openCreateCategoryModal() {
    setCategoryMode('create');
    setSelectedCategory(null);
    setCategoryDraft('');
    setCategoryModalVisible(true);
  }

  function handleCategoryLongPress(category: Category) {
    setSelectedCategory(category);
    setCategoryActionVisible(true);
  }

  function openEditCategoryModal() {
    if (!selectedCategory) return;

    setCategoryMode('edit');
    setCategoryDraft(selectedCategory.name);
    setCategoryActionVisible(false);
    setCategoryModalVisible(true);
  }

  function confirmDeleteCategory() {
    if (!selectedCategory) return;

    const categoryToDelete = selectedCategory;
    setCategoryActionVisible(false);

    Alert.alert(
      'Excluir categoria',
      'Tem certeza que deseja excluir? Produtos dessa categoria ficarao sem categoria.',
      [
        { style: 'cancel', text: 'Cancelar' },
        {
          style: 'destructive',
          text: 'Excluir',
          onPress: async () => {
            try {
              await onDeleteCategory(categoryToDelete);
              Alert.alert('Categoria excluida', 'A categoria foi removida com sucesso.');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Nao foi possivel excluir a categoria.';
              Alert.alert('Erro ao excluir categoria', message);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.productsHeader}>
        <View style={styles.productsHeaderText}>
          <Text style={styles.sectionTitle}>Gerenciamento de Produtos</Text>
          <Text style={styles.sectionSubtitle}>
            Visualize, edite e acompanhe o volume total do seu estoque.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openCreateModal}
          style={({ pressed }) => [styles.addProductButton, pressed && styles.buttonPressed]}>
          <LinearGradient
            colors={theme.brandGradient}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.addProductButtonGradient}>
            <AppIcon name="add" size={20} color="#FFF" />
            <Text style={styles.addProductButtonText}>Novo Produto</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.productsFiltersPanel}>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={18} color={theme.muted} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Pesquisar por nome ou descricao..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Chip
            active={categoryFilter === 'Todos'}
            label="Todos"
            onPress={() => setCategoryFilter('Todos')}
            useGradient
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              active={categoryFilter === category.name}
              label={category.name}
              onLongPress={() => handleCategoryLongPress(category)}
              onPress={() => setCategoryFilter(category.name)}
              useGradient
            />
          ))}
          <Chip active={false} label="+" onPress={openCreateCategoryModal} useGradient />
        </ScrollView>

      </View>

      <View style={styles.productList}>
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => openDetailsModal(product)}
            onLongPress={() => openEditModal(product)}
            onMoveStock={(type) => onMoveStock(product, type, 1)}
          />
        ))}
      </View>
      <ProductDetailsModal
        data={detailsData}
        errorMessage={detailsError}
        loading={detailsLoading}
        onClose={() => setDetailsVisible(false)}
        onEdit={() => {
          if (detailsProduct) {
            setDetailsVisible(false);
            openEditModal(detailsProduct);
          }
        }}
        onNavigate={onNavigate}
        product={detailsProduct}
        visible={detailsVisible}
      />
      <ProductEditorModal
        categories={categories}
        editingProduct={editingProduct}
        form={form}
        imageModalVisible={imageModalVisible}
        isSaving={isImageUploading}
        onChangeForm={updateForm}
        onClose={() => {
          resetForm();
          setModalVisible(false);
        }}
        onDelete={handleDeleteProduct}
        onOpenImageModal={() => setImageModalVisible(true)}
        onPickFromCamera={takeProductPhoto}
        onPickFromGallery={pickProductImage}
        onSave={handleSaveProduct}
        setImageModalVisible={setImageModalVisible}
        visible={modalVisible}
      />

      <CategoryEditorModal
        mode={categoryMode}
        onChangeName={setCategoryDraft}
        onClose={() => {
          setCategoryModalVisible(false);
          setCategoryDraft('');
          setSelectedCategory(null);
        }}
        onSave={handleSaveCategory}
        value={categoryDraft}
        visible={categoryModalVisible}
      />

      <CategoryActionsModal
        category={selectedCategory}
        onClose={() => setCategoryActionVisible(false)}
        onDelete={confirmDeleteCategory}
        onEdit={openEditCategoryModal}
        visible={categoryActionVisible}
      />
    </View>
  );
}

function CategoryEditorModal({
  mode,
  onChangeName,
  onClose,
  onSave,
  value,
  visible,
}: {
  mode: 'create' | 'edit';
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  value: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheetWrap}>
          <View style={styles.categoryModalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.categoryModalTitle}>{mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}</Text>
            <TextInput
              autoFocus
              onChangeText={onChangeName}
              placeholder="Nome da categoria"
              placeholderTextColor="#94a3b8"
              style={styles.categoryInput}
              value={value}
            />
            <View style={styles.modalButtonRow}>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.categoryCancelButton}>
                <Text style={styles.categoryCancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onSave} style={styles.categorySaveButtonLarge}>
                <LinearGradient
                  colors={theme.brandGradient}
                  end={{ x: 1, y: 1 }}
                  start={{ x: 0, y: 0 }}
                  style={styles.categorySaveButtonGradient}>
                  <Text style={styles.categorySaveButtonText}>{mode === 'edit' ? 'Salvar' : 'Criar'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function CategoryActionsModal({
  category,
  onClose,
  onDelete,
  onEdit,
  visible,
}: {
  category: Category | null;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.imageModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.imageModalTitle}>{category?.name ?? 'Categoria'}</Text>
          <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.imageModalAction, pressed && styles.pressed]}>
            <AppIcon name="create-outline" size={22} color={theme.ink} />
            <Text style={styles.imageModalActionText}>Editar</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.imageModalAction, pressed && styles.pressed]}>
            <AppIcon name="trash-outline" size={22} color={theme.critical} />
            <Text style={[styles.imageModalActionText, styles.criticalText]}>Excluir</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalCancelButton}>
            <Text style={styles.modalCancelText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ProductEditorModal({
  categories,
  editingProduct,
  form,
  imageModalVisible,
  isSaving,
  onChangeForm,
  onClose,
  onDelete,
  onOpenImageModal,
  onPickFromCamera,
  onPickFromGallery,
  onSave,
  setImageModalVisible,
  visible,
}: {
  categories: Category[];
  editingProduct: Product | null;
  form: {
    categoryId: string;
    categoryName: string;
    description: string;
    image: string;
    name: string;
    quantity: string;
  };
  imageModalVisible: boolean;
  isSaving: boolean;
  onChangeForm: (key: keyof ProductEditorModalProps['form'], value: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onOpenImageModal: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
  onSave: () => void;
  setImageModalVisible: (visible: boolean) => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.editorLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheetWrap}>
          <View style={styles.editorSheet}>
            <View style={styles.modalHandle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.createProductTitle}>
                    {editingProduct ? 'Editar produto' : 'Novo produto'}
                  </Text>
                  <Text style={styles.editorSubtitle}>Cadastro completo sem sair da tela</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={onClose} style={styles.formCloseButton}>
                  <AppIcon name="close" size={22} color={theme.ink} />
                </Pressable>
              </View>

              <View style={styles.editorForm}>
                <PremiumInput label="Nome" onChangeText={(value) => onChangeForm('name', value)} placeholder="Nome do produto" value={form.name} />
                <PremiumInput
                  label="Descricao"
                  multiline
                  onChangeText={(value) => onChangeForm('description', value)}
                  placeholder="Descricao curta"
                  style={styles.descriptionInput}
                  value={form.description}
                />
                <View style={styles.inlineInputs}>
                  <View style={styles.inlineField}>
                    <PremiumInput
                      keyboardType="number-pad"
                      label="Quantidade"
                      onChangeText={(value) => onChangeForm('quantity', value)}
                      placeholder="0"
                      value={form.quantity}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Categoria</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Chip
                      active={!form.categoryId}
                      label="Nenhuma"
                      onPress={() => {
                        onChangeForm('categoryName', 'Sem categoria');
                        onChangeForm('categoryId', '');
                      }}
                    />
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        active={form.categoryId === category.id}
                        label={category.name}
                        onPress={() => {
                          onChangeForm('categoryName', category.name);
                          onChangeForm('categoryId', category.id);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Imagem</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onOpenImageModal}
                    style={({ pressed }) => [styles.imagePickerButton, pressed && styles.pressed]}>
                    <ProductImage image={form.image} size={76} />
                    <View style={styles.imagePickerTextBlock}>
                      <Text style={styles.imagePickerTitle}>
                        {form.image ? 'Trocar imagem' : 'Adicionar imagem'}
                      </Text>
                      <Text style={styles.imagePickerSubtitle}>Galeria ou camera</Text>
                    </View>
                    <AppIcon name="chevron-forward" size={20} color={theme.muted} />
                  </Pressable>
                </View>

                <View style={styles.modalButtonRow}>
                  <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onSave}
                    disabled={isSaving}
                    style={({ pressed }) => [styles.saveButton, isSaving && styles.buttonDisabled, pressed && styles.buttonPressed]}>
                    <LinearGradient
                      colors={theme.brandGradient}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>{isSaving ? 'Enviando imagem...' : 'Salvar'}</Text>
                    </LinearGradient>
                  </Pressable>
                </View>

                {editingProduct ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onDelete}
                    style={({ pressed }) => [styles.deleteProductButton, pressed && styles.buttonPressed]}>
                    <AppIcon name="trash-outline" size={18} color={theme.critical} />
                    <Text style={styles.deleteProductButtonText}>Apagar produto</Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        <ImageSourceModal
          visible={imageModalVisible}
          onClose={() => setImageModalVisible(false)}
          onPickFromCamera={onPickFromCamera}
          onPickFromGallery={onPickFromGallery}
        />
      </View>
    </Modal>
  );
}

function ProductDetailsModal({
  data,
  errorMessage,
  loading,
  onClose,
  onEdit,
  onNavigate,
  product,
  visible,
}: {
  data: ProductDetailsResponse | null;
  errorMessage: string;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onNavigate: (section: AppSection) => void;
  product: Product | null;
  visible: boolean;
}) {
  const dashboard = data?.dashboard;
  const summary = dashboard?.summary;
  const image = data?.product.image ?? product?.image ?? NO_PHOTO_IMAGE;
  const name = data?.product.name ?? product?.name ?? '';
  const description = data?.product.description ?? product?.description ?? '';
  const categoryName = data?.product.category?.name ?? product?.category?.name ?? product?.categoryName ?? 'Sem categoria';
  const currentStock = dashboard?.currentStock ?? product?.quantity ?? 0;
  const alertDays = dashboard?.alertDaysBefore ?? product?.alertDaysBefore ?? 0;
  const averageDailySales = dashboard?.averageDailySales ?? 0;
  const estimatedDaysLeft = dashboard?.estimatedDaysLeft ?? null;
  const recentMovements = useMemo(() => dashboard?.recentMovements ?? [], [dashboard]);
  const status = getProductStatusBadge(currentStock, estimatedDaysLeft, alertDays);
  const [chartWidth, setChartWidth] = useState(300);

  const groupedMovements = useMemo(() => {
    if (!recentMovements.length) return [] as [string, typeof recentMovements][];
    const trimmed = recentMovements.slice(0, 3);
    const grouped = trimmed.reduce<Record<string, typeof recentMovements>>((acc, movement) => {
      const label = new Date(movement.createdAt).toLocaleDateString('pt-BR');
      if (!acc[label]) acc[label] = [];
      acc[label].push(movement);
      return acc;
    }, {});
    return Object.entries(grouped).reverse();
  }, [recentMovements]);

  const stockSeries = useMemo(() => {
    if (!dashboard) return [] as { date: string; stock: number }[];

    const movements = [...dashboard.recentMovements].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    if (!movements.length) {
      return [{ date: new Date().toLocaleDateString('pt-BR'), stock: dashboard.currentStock }];
    }

    let runningStock = dashboard.currentStock;

    const calculated = [...movements]
      .reverse()
      .map((movement) => {
        const stockAfter = runningStock;
        runningStock = movement.type === 'in'
          ? Math.max(runningStock - movement.quantity, 0)
          : runningStock + movement.quantity;
        return { createdAt: movement.createdAt, stockAfter };
      })
      .reverse();

    const grouped = new Map<string, number>();
    calculated.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString('pt-BR');
      grouped.set(date, item.stockAfter);
    });

    return Array.from(grouped.entries()).map(([date, stock]) => ({ date, stock }));
  }, [dashboard]);

  const maxStock = Math.max(...stockSeries.map((item) => item.stock), currentStock, 1);

  const points = useMemo(() => {
    if (!stockSeries.length) return [];
    const N = stockSeries.length;
    const paddingLeft = 24;
    const paddingRight = 24;
    const paddingTop = 20;
    const paddingBottom = 35;
    const chartHeight = 145;
    const maxVal = maxStock || 1;

    return stockSeries.map((item, index) => {
      const x = N > 1 
        ? paddingLeft + (index * (chartWidth - paddingLeft - paddingRight)) / (N - 1)
        : chartWidth / 2;
      const y = paddingTop + (chartHeight - paddingTop - paddingBottom) * (1 - (item.stock / maxVal));
      return { x, y, date: item.date, stock: item.stock };
    });
  }, [stockSeries, chartWidth, maxStock]);

  const linePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  if (!visible) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.detailsModal}>
          <View style={styles.detailsHeader}>
            <View>
              <Text style={styles.detailsTitle}>Detalhes do Produto</Text>
              <Text style={styles.detailsSubtitle}>Dashboard e historico.</Text>
            </View>
            <View style={styles.detailsHeaderActions}>
              <Pressable onPress={() => {
                onClose();
                onNavigate('history');
              }} style={styles.detailsPrimaryButton}>
                <AppIcon name="history" size={16} color="#ffffff" />
                <Text style={styles.detailsPrimaryButtonText}>Historico geral</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.detailsLoading}>
              <Text style={styles.detailsLoadingText}>Carregando...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {errorMessage ? (
                <View style={styles.detailsNotice}>
                  <Text style={styles.detailsNoticeText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.detailsHero}>
                <View style={styles.detailsImageWrap}>
                  <ProductImage image={image} size={96} />
                </View>
                <View style={styles.detailsHeroText}>
                  <View style={styles.detailsBadgeRow}>
                    <Text style={styles.detailsBadgeNeutral}>Produto</Text>
                    <Text style={styles.detailsBadgeCategory}>{categoryName}</Text>
                    <Text style={[styles.detailsBadgeStatus, { backgroundColor: status.badgeBg, color: status.badgeText }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.detailsProductName}>{name}</Text>
                  <Text style={styles.detailsDescription}>{description || 'Sem descricao.'}</Text>
                </View>
              </View>

              <View style={styles.detailsPanel}>
                <View style={styles.detailsPanelHeader}>
                  <View>
                    <Text style={styles.detailsPanelKicker}>Grafico de estoque</Text>
                    <Text style={styles.detailsPanelTitle}>Ultimas movimentacoes e tendencia</Text>
                  </View>
                  <View style={styles.detailsAverageCard}>
                    <Text style={styles.detailsAverageLabel}>Media diaria</Text>
                    <Text style={styles.detailsAverageValue}>{averageDailySales.toFixed(1)}</Text>
                  </View>
                </View>

                <View 
                  style={styles.detailsChartWrap}
                  onLayout={(e) => {
                    const { width } = e.nativeEvent.layout;
                    if (width > 0) {
                      setChartWidth(width);
                    }
                  }}
                >
                  <View style={styles.detailsChartHeader}>
                    <Text style={styles.detailsChartKicker}>Evolucao do estoque</Text>
                    <View style={styles.detailsChartBadge}>
                      <Text style={styles.detailsChartBadgeText}>Atual: {currentStock}</Text>
                    </View>
                  </View>

                  {stockSeries.length > 0 ? (
                    <Svg width="100%" height={145}>
                      <Defs>
                        <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor={theme.accent} stopOpacity={0.2} />
                          <Stop offset="100%" stopColor={theme.accent} stopOpacity={0.0} />
                        </SvgLinearGradient>
                      </Defs>
                      
                      {/* Area under the line */}
                      {points.length > 1 && (
                        <Path
                          d={`${linePath} L ${points[points.length - 1].x} 110 L ${points[0].x} 110 Z`}
                          fill="url(#chartGradient)"
                        />
                      )}

                      {/* Line itself */}
                      {points.length > 1 && (
                        <Path
                          d={linePath}
                          fill="none"
                          stroke={theme.accent}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Points, values, and dates */}
                      {points.map((p, idx) => (
                        <G key={idx}>
                          {/* Value label above the point */}
                          <SvgText
                            x={p.x}
                            y={p.y - 8}
                            fontSize="9"
                            fontWeight="800"
                            fill={theme.ink}
                            textAnchor="middle"
                          >
                            {p.stock}
                          </SvgText>

                          {/* Circle point */}
                          <Circle
                            cx={p.x}
                            cy={p.y}
                            r={5}
                            fill={theme.accent}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />

                          {/* Date label at the bottom */}
                          <SvgText
                            x={p.x}
                            y={132}
                            fontSize="8"
                            fontWeight="600"
                            fill={theme.muted}
                            textAnchor="middle"
                          >
                            {p.date}
                          </SvgText>
                        </G>
                      ))}
                    </Svg>
                  ) : (
                    <View style={styles.detailsChartEmpty}>
                      <Text style={styles.detailsChartEmptyText}>Sem dados disponiveis</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailsPanel}>
                  <Text style={styles.detailsPanelKicker}>Dashboard do produto</Text>
                  <View style={styles.detailsMetricList}>
                    <DetailsMetric label="Estoque atual" value={String(currentStock)} tone="blue" icon="cube" />
                    <DetailsMetric label="Total de entradas" value={String(summary?.totalEntries ?? 0)} tone="green" icon="arrow-up" />
                    <DetailsMetric label="Total de saidas" value={String(summary?.totalOutputs ?? 0)} tone="red" icon="arrow-down" />
                    <DetailsMetric label="Previsao de dias restantes" value={estimatedDaysLeft === null ? 'Sem previsao' : `${estimatedDaysLeft} dias`} tone={status.tone} icon="alert-circle-outline" />
                  </View>
                </View>

                <View style={styles.detailsPanel}>
                  <Text style={styles.detailsPanelKicker}>Leitura rapida</Text>
                  <View style={styles.detailsInfoList}>
                    <DetailsInfoRow icon="chart" label="Media de saida diaria" value={averageDailySales.toFixed(1)} />
                    <DetailsInfoRow icon="spark" label="Dias para alerta" value={`${alertDays} dias`} />
                    <DetailsInfoRow icon="trend" label="Tendencia atual" value={status.label} />
                  </View>
                </View>
              </View>

              <View style={styles.detailsPanel}>
                <View style={styles.detailsHistoryHeader}>
                  <View>
                    <Text style={styles.detailsPanelKicker}>Historico de movimentacoes</Text>
                    <Text style={styles.detailsPanelTitle}>Ultimos lancamentos do produto</Text>
                  </View>
                  <Text style={styles.detailsHistoryBadge}>{recentMovements.length} registros</Text>
                </View>

                {groupedMovements.length ? (
                  <View style={styles.detailsHistoryList}>
                    {groupedMovements.map(([dateLabel, movements]) => (
                      <View key={dateLabel} style={styles.detailsHistoryGroup}>
                        <View style={styles.detailsHistoryGroupHeader}>
                          <Text style={styles.detailsHistoryGroupLabel}>{dateLabel}</Text>
                          <View style={styles.detailsHistoryDivider} />
                        </View>

                        <View style={styles.detailsHistoryTimeline}>
                          {movements.map((movement) => {
                            const isEntry = movement.type === 'in';
                            return (
                              <View key={movement.id} style={styles.detailsHistoryItem}>
                                <View style={[styles.detailsHistoryDot, isEntry ? styles.detailsHistoryDotIn : styles.detailsHistoryDotOut]} />
                                <View style={styles.detailsHistoryCard}>
                                  <View style={styles.detailsHistoryCardLeft}>
                                    <View style={[styles.detailsHistoryIcon, isEntry ? styles.detailsHistoryIconIn : styles.detailsHistoryIconOut]}>
                                      <AppIcon name={isEntry ? 'arrow-down' : 'arrow-up'} size={18} color={isEntry ? theme.ok : theme.critical} />
                                    </View>
                                    <View>
                                      <Text style={styles.detailsHistoryTitle}>{isEntry ? 'Entrada' : 'Saida'} de {movement.quantity} unidades</Text>
                                      <Text style={styles.detailsHistoryMeta}>{new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                  </View>
                                  <View style={styles.detailsHistoryCardRight}>
                                    <Text style={[styles.detailsHistoryAmount, isEntry ? styles.detailsHistoryAmountIn : styles.detailsHistoryAmountOut]}>
                                      {isEntry ? '+' : '-'}{movement.quantity}
                                    </Text>
                                    <Text style={styles.detailsHistoryAmountLabel}>Unidades</Text>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.detailsEmptyPanel}>
                    <AppIcon name="history" size={28} color={theme.muted} />
                    <Text style={styles.detailsEmptyTitle}>Sem movimentacoes recentes</Text>
                    <Text style={styles.detailsEmptySubtitle}>As proximas entradas e saidas aparecem aqui automaticamente.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getProductStatusBadge(currentStock: number, estimatedDaysLeft: number | null, alertDaysBefore: number) {
  if (currentStock <= 0) {
    return { label: 'Critico', badgeBg: '#fee2e2', badgeText: '#e11d48', tone: 'red' as const };
  }

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDaysBefore) {
    return { label: 'Baixo', badgeBg: '#ffedd5', badgeText: '#f59e0b', tone: 'orange' as const };
  }

  return { label: 'OK', badgeBg: '#dcfce7', badgeText: '#10b981', tone: 'green' as const };
}

function DetailsMetric({
  icon,
  label,
  tone,
  value,
}: {
  icon: AppIconName;
  label: string;
  tone: 'blue' | 'green' | 'red' | 'orange';
  value: string;
}) {
  const toneMap = {
    blue: { bg: '#eff6ff', text: '#2563eb' },
    green: { bg: '#ecfdf3', text: '#10b981' },
    red: { bg: '#fee2e2', text: '#e11d48' },
    orange: { bg: '#ffedd5', text: '#f59e0b' },
  } as const;

  const colors = toneMap[tone];

  return (
    <View style={styles.detailsMetricCard}>
      <View style={[styles.detailsMetricIcon, { backgroundColor: colors.bg }]}
      >
        <AppIcon name={icon} size={16} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailsMetricLabel}>{label}</Text>
        <Text style={styles.detailsMetricValue}>{value}</Text>
      </View>
    </View>
  );
}

function DetailsInfoRow({ icon, label, value }: { icon: 'chart' | 'spark' | 'trend'; label: string; value: string }) {
  const iconMap = {
    chart: 'receipt-outline',
    spark: 'flash-outline',
    trend: 'arrow-up',
  } as const;

  const iconName = iconMap[icon];

  return (
    <View style={styles.detailsInfoRow}>
      <View style={styles.detailsInfoIcon}>
        <AppIcon name={iconName as AppIconName} size={16} color={theme.accent} />
      </View>
      <View style={styles.detailsInfoText}>
        <Text style={styles.detailsInfoLabel}>{label}</Text>
        <Text style={styles.detailsInfoValue}>{value}</Text>
      </View>
    </View>
  );
}

type ProductEditorModalProps = {
  form: {
    categoryId: string;
    categoryName: string;
    description: string;
    image: string;
    name: string;
    quantity: string;
  };
};

function ProductCard({
  onPress,
  onLongPress,
  product,
  onMoveStock
}: {
  onPress: () => void;
  onLongPress?: () => void;
  product: Product;
  onMoveStock?: (type: StockMovement['type']) => void;
}) {
  const status = getStockStatus(product);
  const categoryLabel = product.category?.name ?? product.categoryName ?? 'Sem categoria';

  return (
    <Pressable
      accessibilityRole="button"
      delayLongPress={240}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.productCard, pressed && styles.productCardPressed]}>
      <View style={styles.productCardTop}>
        <View style={styles.productImageContainer}>
          <ProductImage image={product.image} size={72} />
        </View>
        <View style={styles.productMainInfo}>
          <View style={styles.productHeaderRow}>
            <View style={styles.productTitleBlock}>
              <View style={styles.productMetaTop}>
                <Text style={styles.productCategoryTag}>{categoryLabel}</Text>
                <View style={styles.metaDot} />
                <View style={[styles.statusTag, { backgroundColor: status.softColor }]}>
                  <Text style={[styles.statusTagText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
            </View>
            <View style={styles.productQuantityBlock}>
              <Text style={styles.productQuantityValue}>{product.quantity}</Text>
              <Text style={styles.productQuantityLabel}>Unidades</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.productDescription}>{product.description}</Text>

          <View style={styles.productCardFooter}>
            <View style={styles.productActionsRow}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onMoveStock?.('in');
                }}
                style={({ pressed }) => [styles.actionButton, styles.entryButtonAction, pressed && styles.pressed]}>
                <Text style={styles.entryActionText}>+ Entrada</Text>
              </Pressable>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onMoveStock?.('out');
                }}
                style={({ pressed }) => [styles.actionButton, styles.exitButtonAction, pressed && styles.pressed]}>
                <Text style={styles.exitActionText}>- Saida</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function HistorySection({ movements }: { movements: StockMovement[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderBlock}>
        <Text style={styles.sectionTitle}>Historico de Operacoes</Text>
        <Text style={styles.sectionSubtitle}>
          Acompanhe cada entrada e saida do seu estoque em tempo real.
        </Text>
      </View>

      <MovementPanel movements={movements} />
    </View>
  );
}

function MovementPanel({ compact, movements }: { compact?: boolean; movements: StockMovement[] }) {
  const visibleMovements = compact ? movements.slice(0, 3) : movements;

  const grouped = useMemo(() => {
    return visibleMovements.reduce<Record<string, StockMovement[]>>((acc, m) => {
      const date = new Date(m.createdAt).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(m);
      return acc;
    }, {});
  }, [visibleMovements]);

  return (
    <View style={styles.movementList}>
      {Object.entries(grouped).length ? (
        Object.entries(grouped).map(([dateLabel, items]) => (
          <View key={dateLabel} style={{ gap: 16, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.stroke }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{dateLabel}</Text>
              </View>
              <View style={{ height: 1, flex: 1, backgroundColor: theme.stroke }} />
            </View>

            <View style={{ gap: 12 }}>
              {items.map((movement) => (
                <View key={movement.id}>
                  <View style={[styles.movementRow, compact && styles.movementRowCompact]}>
                    <View style={[styles.movementIcon, movement.type === 'in' ? styles.movementIn : styles.movementOut]}>
                      <AppIcon
                        name={movement.type === 'in' ? 'arrow-down' : 'arrow-up'}
                        size={20}
                        color={movement.type === 'in' ? theme.ok : theme.critical}
                      />
                    </View>
                    <View style={styles.movementInfo}>
                      <Text numberOfLines={1} style={styles.movementProduct}>{movement.productName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.movementDate}>{new Date(movement.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.stroke }} />
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: movement.type === 'in' ? theme.ok : theme.critical }}>
                          {movement.type === 'in' ? 'Entrada' : 'Saida'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.movementAmountWrap}>
                      <Text style={[styles.movementAmount, compact && styles.movementAmountCompact, movement.type === 'in' ? styles.movementAmountIn : styles.movementAmountOut]}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: theme.muted }}>Unidades</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.panel, { alignItems: 'center', paddingVertical: 48, borderStyle: 'dashed' }]}>
          <AppIcon name="history" size={48} color={theme.stroke} />
          <Text style={[styles.emptyHeader]}>Sem movimentações.</Text>
          <Text style={styles.emptyText}>As operações realizadas aparecerão nesta timeline.</Text>
        </View>
      )}
    </View>
  );
}

function DashboardEmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: AppIconName;
}) {
  return (
    <View style={styles.dashboardEmpty}>
      <View style={styles.dashboardEmptyIcon}>
        <AppIcon name={icon} size={28} color={theme.muted} />
      </View>
      <Text style={styles.dashboardEmptyTitle}>{title}</Text>
      <Text style={styles.dashboardEmptyText}>{description}</Text>
    </View>
  );
}

function TopSellingList({ items }: { items: TopSellingProduct[] }) {
  if (!items.length) {
    return (
      <DashboardEmptyState
        icon="flame-outline"
        title="Sem vendas registradas"
        description="Assim que houver saidas, o ranking aparecera aqui."
      />
    );
  }

  const maxSold = Math.max(...items.map((item) => item.soldQuantity), 1);

  return (
    <View style={styles.rankingList}>
      {items.map((item, index) => {
        const width = `${Math.max((item.soldQuantity / maxSold) * 100, 6)}%`;
        return (
          <View key={item.productId} style={styles.rankingCard}>
            <View style={styles.rankingHeader}>
              <View style={styles.rankingLeft}>
                <View style={styles.rankingBadge}>
                  <Text style={styles.rankingBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingTitle}>{item.productName}</Text>
                  <Text style={styles.rankingMeta}>Estoque atual: {item.currentQuantity} un.</Text>
                </View>
              </View>
              <View style={styles.rankingRight}>
                <Text style={styles.rankingValue}>{formatNumber(item.soldQuantity)}</Text>
              </View>
            </View>
            <View style={styles.rankingTrack}>
              <View style={[styles.rankingBar, { width: width as any }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TopCategoryList({ items }: { items: TopCategoryInsight[] }) {
  if (!items.length) {
    return (
      <DashboardEmptyState
        icon="receipt-outline"
        title="Sem categorias vendidas"
        description="Ainda nao ha saidas suficientes para montar o ranking por categoria."
      />
    );
  }

  const maxSold = Math.max(...items.map((item) => item.soldQuantity), 1);

  return (
    <View style={styles.rankingList}>
      {items.map((item) => {
        const width = `${Math.max((item.soldQuantity / maxSold) * 100, 8)}%`;
        return (
          <View key={item.categoryName} style={styles.rankingCard}>
            <View style={styles.rankingHeader}>
              <View style={styles.rankingLeft}>
                <View style={styles.rankingBadge}>
                  <Text style={styles.rankingBadgeText}>{item.rank}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingTitle}>{item.categoryName}</Text>
                  <Text style={styles.rankingMeta}>{item.percentage.toFixed(0)}% do total vendido</Text>
                </View>
              </View>
              <View style={styles.rankingRight}>
                <Text style={styles.rankingValue}>{formatNumber(item.soldQuantity)}</Text>
              </View>
            </View>
            <View style={styles.rankingTrack}>
              <View style={[styles.rankingBar, { width: width as any }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LowStockList({ items }: { items: LowStockInsight[] }) {
  if (!items.length) {
    return (
      <DashboardEmptyState
        icon="alert-circle-outline"
        title="Tudo sob controle"
        description="Nenhum produto esta abaixo do limite configurado."
      />
    );
  }

  return (
    <View style={styles.alertRows}>
      {items.map((item) => (
        <View key={item.productId} style={styles.alertRow}>
          <View
            style={
              item.status === 'critical'
                ? [styles.alertRowIcon, styles.alertRowIconCritical]
                : [styles.alertRowIcon, styles.alertRowIconLow]
            }
          >
            <AppIcon name="alert-circle-outline" size={18} color={item.status === 'critical' ? theme.critical : theme.low} />
          </View>
          <View style={styles.alertRowInfo}>
            <Text style={styles.alertRowTitle}>{item.productName}</Text>
            <Text style={styles.alertRowMeta}>Atual: {item.currentQuantity}</Text>
          </View>
          <View style={styles.alertRowRight}>
            <Text
              style={
                item.status === 'critical'
                  ? [styles.alertRowStatus, styles.alertRowStatusCritical]
                  : [styles.alertRowStatus, styles.alertRowStatusLow]
              }
            >
              {item.status === 'critical' ? 'Critico' : 'Baixo'}
            </Text>
            <Text style={styles.alertRowThreshold}>{item.threshold}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ProfileSection({
  onDeleteAccount,
  onLogout,
  user,
}: {
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  user: AuthSession['user'];
}) {
  const [deletingAccount, setDeletingAccount] = useState(false);

  function handleDeleteAccountPress() {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta? Essa acao nao pode ser desfeita.',
      [
        { style: 'cancel', text: 'Cancelar' },
        {
          style: 'destructive',
          text: 'Excluir conta',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await onDeleteAccount();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Nao foi possivel excluir a conta.';
              Alert.alert('Erro ao excluir conta', message);
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderBlock}>
        <Text style={styles.sectionTitle}>Perfil do Usuario</Text>
        <Text style={styles.sectionSubtitle}>
          Gerencie suas informacoes pessoais e configuracoes de conta.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.cardTitle}>Dados Pessoais</Text>
        <Text style={styles.cardSubtitle}>Informacoes basicas de identificacao.</Text>
        <View style={styles.infoCardList}>
          <View style={styles.infoCardItem}>
            <Text style={styles.infoCardLabel}>Nome Completo</Text>
            <Text style={styles.infoCardValue}>{user.name}</Text>
          </View>
          <View style={styles.infoCardItem}>
            <Text style={styles.infoCardLabel}>Endereco de E-mail</Text>
            <Text style={styles.infoCardValue}>{user.email}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.panel, styles.dangerPanel]}>
        <Text style={styles.dangerTitle}>Zona de Perigo</Text>
        <Text style={styles.cardSubtitle}>Acoes irreversiveis relacionadas a sua conta.</Text>
        <Text style={styles.dangerText}>
          Ao excluir sua conta, todos os dados de estoque, produtos e historico serao
          removidos permanentemente. Esta acao nao pode ser desfeita.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={deletingAccount}
          onPress={handleDeleteAccountPress}
          style={({ pressed }) => [
            styles.deleteAccountButton,
            deletingAccount && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <AppIcon name="trash-outline" size={19} color={theme.critical} />
          <Text style={styles.deleteAccountButtonText}>
            {deletingAccount
              ? 'Excluindo conta...'
              : 'Excluir Minha Conta Permanentemente'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.profileSummaryCard}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileAvatarText}>{getInitial(user.name)}</Text>
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileRole}>{user.role}</Text>

        <View style={styles.profileMetaGrid}>
          <View style={styles.profileMetaCard}>
            <Text style={styles.profileMetaLabel}>Desde</Text>
            <Text style={styles.profileMetaValue}>{user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })
              : '-'}</Text>
          </View>
          <View style={styles.profileMetaCard}>
            <Text style={styles.profileMetaLabel}>Status</Text>
            <View style={styles.profileStatusRow}>
              <View style={styles.profileStatusDot} />
              <Text style={styles.profileStatusText}>Conta Ativa</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}>
        <AppIcon name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </View>
  );
}


function Chip({
  active,
  label,
  onLongPress,
  onPress,
  useGradient,
}: {
  active: boolean;
  label: string;
  onLongPress?: () => void;
  onPress: () => void;
  useGradient?: boolean;
}) {
  const usesGradient = useGradient || active || label === '+';
  const gradientColors = usesGradient ? theme.brandGradient : ([theme.surface, theme.surface] as const);

  return (
    <Pressable
      accessibilityRole="button"
      delayLongPress={240}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chipPressable, pressed && styles.pressed]}>
      <LinearGradient
        colors={gradientColors}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.chip, usesGradient && styles.chipGradient]}>
        <Text style={[styles.chipText, usesGradient && styles.chipTextActive]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function PremiumInput({
  label,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        {...props}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
    </View>
  );
}

function ProductImage({ image, size }: { image: string; size: number }) {
  const hasPhoto = image && image !== NO_PHOTO_IMAGE;
  if (hasPhoto) {
    return <Image source={{ uri: image }} style={[styles.productImage, { height: size, width: size }]} contentFit="cover" />;
  }
  return (
    <View style={[styles.noPhotoBox, { height: size, width: size }]}>
      <AppIcon name="add" size={Math.round(size * 0.42)} color={theme.accent} />
    </View>
  );
}

function ImageSourceModal({
  onClose,
  onPickFromCamera,
  onPickFromGallery,
  visible,
}: {
  onClose: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.imageModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.imageModalTitle}>Imagem do produto</Text>
          <ImageModalAction icon="image-outline" label="Buscar na galeria" onPress={onPickFromGallery} />
          <ImageModalAction icon="camera-outline" label="Tirar foto" onPress={onPickFromCamera} />
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.modalCancelButton}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ImageModalAction({ icon, label, onPress }: { icon: AppIconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.imageModalAction, pressed && styles.pressed]}>
      <AppIcon name={icon} size={22} color={theme.ink} />
      <Text style={styles.imageModalActionText}>{label}</Text>
    </Pressable>
  );
}

function AppLogo({ size }: { size: number }) {
  const markSize = Math.round(size * 0.34);
  return (
    <View style={[styles.logo, { borderRadius: Math.round(size * 0.35), height: size, width: size }]}>
      <Text style={[styles.logoLetter, { fontSize: Math.round(size * 0.55), letterSpacing: -2 }]}>E</Text>
      <View style={[styles.logoMark, { borderRadius: Math.round(markSize * 0.4), height: markSize, width: markSize }]}>
        <AppIcon name="cube" size={Math.round(size * 0.2)} color={theme.ink} strokeWidth={2.5} />
      </View>
    </View>
  );
}

function SidebarItem({ active, icon, label, onPress }: { active: boolean; icon: AppIconName; label: string; onPress: () => void }) {
  const inactiveColor = 'rgba(203, 213, 225, 0.82)';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.sidebarItem, active && styles.sidebarItemActive, pressed && styles.pressed]}>
      <AppIcon name={icon} size={19} color={active ? '#FFFFFF' : inactiveColor} />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color = 'blue',
  helperText,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  color?: 'blue' | 'orange' | 'red' | 'green' | 'slate' | 'purple';
  helperText?: string;
}) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#3b82f6', border: '#dbeafe' },
    orange: { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
    red: { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6' },
    green: { bg: '#f0fdf4', text: '#10b981', border: '#dcfce7' },
    slate: { bg: '#f8fafc', text: '#64748b', border: '#f1f5f9' },
    purple: { bg: '#faf5ff', text: '#a855f7', border: '#f3e8ff' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }]}>
        <AppIcon name={icon} size={20} color={colors.text} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {helperText ? <Text style={styles.metricHelper}>{helperText}</Text> : null}
    </View>
  );
}


type WeeklySalesInsight = {
  comparisonLabel: string;
  currentWeekSales: number;
  previousWeekSales: number;
  direction: 'up' | 'down' | 'flat';
  valueLabel: string;
  variationPercentage: number;
};

type TopSellingProduct = {
  currentQuantity: number;
  productId: string;
  productName: string;
  soldQuantity: number;
};

type TopCategoryInsight = {
  categoryName: string;
  percentage: number;
  rank: number;
  soldQuantity: number;
};

type LowStockInsight = {
  currentQuantity: number;
  productId: string;
  productName: string;
  status: 'critical' | 'low';
  threshold: number;
};

type InventoryInsights = {
  alerts: { color: string; daysLeftText: string; id: string; name: string; suggestedRestock: number }[];
  catalogAvailability: number;
  criticalProducts: number;
  dailyBalance: number;
  lowProducts: number;
  lowStockProducts: LowStockInsight[];
  mostConsumedShort: string;
  outOfStock: number;
  periodEntries: number;
  periodOutputs: number;
  topCategories: TopCategoryInsight[];
  topSellingProducts: TopSellingProduct[];
  totalProducts: number;
  totalStock: number;
  weeklySales: WeeklySalesInsight;
};

function getInventoryInsights(products: Product[], movements: StockMovement[], fallbackAlertDays = 7): InventoryInsights {
  const entries = movements.filter((movement) => movement.type === 'in');
  const outputs = movements.filter((movement) => movement.type === 'out');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const productMap = new Map(products.map((product) => [product.id, product]));
  const consumedByProduct = outputs.reduce<Record<string, number>>((acc, movement) => {
    acc[movement.productName] = (acc[movement.productName] ?? 0) + movement.quantity;
    return acc;
  }, {});
  const mostConsumed =
    Object.entries(consumedByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nenhum';

  const alerts = products
    .filter((product) => getStockStatus(product, movements, fallbackAlertDays).level !== 'ok')
    .map((product) => {
      const forecast = getProductForecast(product, movements);
      const status = getStockStatus(product, movements, fallbackAlertDays);
      const alertDays = product.alertDaysBefore ?? fallbackAlertDays;
      const suggestedRestock = forecast.dailyAverage
        ? Math.max(Math.round(forecast.dailyAverage * alertDays) - product.quantity, 1)
        : Math.max(alertDays - product.quantity, 1);
      return {
        color: status.color,
        daysLeftText: forecast.daysLeftText,
        id: product.id,
        name: product.name,
        suggestedRestock,
      };
    });

  const catalogAvailability = products.length
    ? (products.filter((product) => product.quantity > 0).length / products.length) * 100
    : 0;

  const dailyBalance = entries
    .filter((movement) => now - new Date(movement.createdAt).getTime() <= dayMs)
    .reduce((total, movement) => total + movement.quantity, 0)
    - outputs
      .filter((movement) => now - new Date(movement.createdAt).getTime() <= dayMs)
      .reduce((total, movement) => total + movement.quantity, 0);

  const currentWeekSales = outputs
    .filter((movement) => now - new Date(movement.createdAt).getTime() <= weekMs)
    .reduce((total, movement) => total + movement.quantity, 0);

  const previousWeekSales = outputs
    .filter((movement) => {
      const diff = now - new Date(movement.createdAt).getTime();
      return diff > weekMs && diff <= weekMs * 2;
    })
    .reduce((total, movement) => total + movement.quantity, 0);

  const variationPercentage = previousWeekSales
    ? ((currentWeekSales - previousWeekSales) / previousWeekSales) * 100
    : 0;
  const weeklyDirection = currentWeekSales > previousWeekSales
    ? 'up'
    : currentWeekSales < previousWeekSales
      ? 'down'
      : 'flat';
  const weeklySales: WeeklySalesInsight = {
    comparisonLabel: previousWeekSales
      ? `${Math.abs(variationPercentage).toFixed(0)}% vs semana anterior`
      : 'Sem base comparativa',
    currentWeekSales,
    previousWeekSales,
    direction: weeklyDirection,
    valueLabel: formatNumber(currentWeekSales),
    variationPercentage,
  };

  const soldByProduct = outputs.reduce<Record<string, { name: string; quantity: number }>>((acc, movement) => {
    const existing = acc[movement.productId] ?? { name: movement.productName, quantity: 0 };
    acc[movement.productId] = {
      name: existing.name,
      quantity: existing.quantity + movement.quantity,
    };
    return acc;
  }, {});

  const topSellingProducts = Object.entries(soldByProduct)
    .map(([productId, data]) => {
      const product = productMap.get(productId);
      return {
        currentQuantity: product?.quantity ?? 0,
        productId,
        productName: product?.name ?? data.name,
        soldQuantity: data.quantity,
      };
    })
    .sort((a, b) => b.soldQuantity - a.soldQuantity)
    .slice(0, 5);

  const soldByCategory = outputs.reduce<Record<string, number>>((acc, movement) => {
    const product = productMap.get(movement.productId);
    const categoryName = product?.category?.name ?? product?.categoryName ?? 'Sem categoria';
    acc[categoryName] = (acc[categoryName] ?? 0) + movement.quantity;
    return acc;
  }, {});

  const totalSold = Object.values(soldByCategory).reduce((total, value) => total + value, 0);
  const topCategories = Object.entries(soldByCategory)
    .map(([categoryName, soldQuantity]) => ({
      categoryName,
      percentage: totalSold ? (soldQuantity / totalSold) * 100 : 0,
      soldQuantity,
    }))
    .sort((a, b) => b.soldQuantity - a.soldQuantity)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const lowStockProducts = products
    .map((product) => {
      const status = getStockStatus(product, movements, fallbackAlertDays);
      if (status.level === 'ok') return null;
      return {
        currentQuantity: product.quantity,
        productId: product.id,
        productName: product.name,
        status: status.level,
        threshold: product.alertDaysBefore ?? fallbackAlertDays,
      };
    })
    .filter((item): item is LowStockInsight => Boolean(item));

  return {
    alerts,
    catalogAvailability,
    criticalProducts: products.filter((product) => getStockStatus(product, movements, fallbackAlertDays).level === 'critical').length,
    dailyBalance,
    lowProducts: products.filter((product) => getStockStatus(product, movements, fallbackAlertDays).level === 'low').length,
    lowStockProducts,
    mostConsumedShort: mostConsumed.length > 8 ? `${mostConsumed.slice(0, 8)}...` : mostConsumed,
    outOfStock: products.filter((product) => product.quantity === 0).length,
    periodEntries: entries.reduce((total, movement) => total + movement.quantity, 0),
    periodOutputs: outputs.reduce((total, movement) => total + movement.quantity, 0),
    topCategories,
    topSellingProducts,
    totalProducts: products.length,
    totalStock: products.reduce((total, product) => total + product.quantity, 0),
    weeklySales,
  };
}

function getProductForecast(product: Product, movements: StockMovement[]) {
  const outputs = movements.filter((movement) => movement.productId === product.id && movement.type === 'out');
  const totalOutput = outputs.reduce((total, movement) => total + movement.quantity, 0);
  const dailyAverage = totalOutput / Math.max(outputs.length, 1);
  const daysLeft = dailyAverage > 0 ? Math.floor(product.quantity / dailyAverage) : null;

  return {
    dailyAverage,
    daysLeft,
    daysLeftText: daysLeft === null ? 'sem previsao' : `${daysLeft} dia(s)`,
  };
}

function getStockStatus(product: Product, movements: StockMovement[] = [], fallbackAlertDays = 7) {
  if (product.quantity <= 0) {
    return { color: theme.critical, label: 'Critico', level: 'critical' as const, softColor: theme.criticalSoft };
  }

  const alertDays = product.alertDaysBefore ?? fallbackAlertDays;
  const estimatedDaysLeft =
    product.estimatedDaysLeft ?? getProductForecast(product, movements).daysLeft;

  if (estimatedDaysLeft !== null && estimatedDaysLeft <= alertDays) {
    return { color: theme.low, label: 'Baixo', level: 'low' as const, softColor: theme.lowSoft };
  }

  return { color: theme.ok, label: 'OK', level: 'ok' as const, softColor: theme.okSoft };
}

function getSectionTitle(section: AppSection) {
  if (section === 'products') return 'Produtos';
  if (section === 'history') return 'Historico';
  if (section === 'profile') return 'Perfil';
  if (section === 'settings') return 'Configuracoes';
  if (section === 'terms') return 'Termos de Uso';
  if (section === 'privacy') return 'Privacidade';
  if (section === 'about') return 'Sobre';
  return 'Inicio';
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || 'E';
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR');
}


function SettingsSection({
  alertDaysBefore,
  subMenu,
  onSubMenuChange,
  onNavigate,
  onSaveAlertDays,
}: {
  alertDaysBefore: number;
  subMenu: 'main' | 'stock' | 'legal';
  onSubMenuChange: (menu: 'main' | 'stock' | 'legal') => void;
  onNavigate: (section: AppSection) => void;
  onSaveAlertDays: (nextValue: number) => Promise<void>;
}) {
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [alertDaysDraft, setAlertDaysDraft] = useState(String(alertDaysBefore));
  const [savingAlertDays, setSavingAlertDays] = useState(false);

  useEffect(() => {
    setAlertDaysDraft(String(alertDaysBefore));
  }, [alertDaysBefore]);

  async function handleSaveAlertDays() {
    const parsedDays = Number(alertDaysDraft);
    if (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      Alert.alert('Dias invalidos', 'Informe um numero entre 1 e 365.');
      return;
    }

    setSavingAlertDays(true);
    try {
      await onSaveAlertDays(Math.round(parsedDays));
      Alert.alert('Preferencia salva', 'Atualizamos os dias de alerta de estoque.');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Nao foi possivel salvar a preferencia.';
      Alert.alert('Erro ao salvar', message);
    } finally {
      setSavingAlertDays(false);
    }
  }

  if (subMenu === 'stock') {
    return (
      <View style={styles.section}>
        <Pressable onPress={() => onSubMenuChange('main')} style={styles.backButton}>
          <AppIcon name="chevron-back" size={20} color={theme.ink} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.sectionHeaderBlock}>
          <Text style={styles.sectionTitle}>Estoque e Alertas</Text>
          <Text style={styles.sectionSubtitle}>
            Ajuste os dias de antecedencia para alertas de reposicao.
          </Text>
        </View>

        <View style={[styles.panel, { gap: 20 }]}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.ink, fontSize: 16, fontWeight: '800' }}>
              Dias de antecedência
            </Text>
            <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 20 }}>
              Defina com quantos dias de antecedência o sistema deve alertar que o estoque de um produto está próximo do fim.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 10 }}>
            <TextInput
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={(value) => setAlertDaysDraft(value.replace(/\D/g, ''))}
              placeholder="7"
              placeholderTextColor={theme.muted}
              value={alertDaysDraft}
              style={{
                backgroundColor: theme.soft,
                borderColor: theme.stroke,
                borderRadius: 14,
                borderWidth: 1,
                color: theme.ink,
                fontSize: 15,
                fontWeight: '700',
                height: 54,
                width: 100,
                textAlign: 'center',
              }}
            />
            <Text style={{ color: theme.ink, fontSize: 15, fontWeight: '700' }}>dias</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={savingAlertDays}
            onPress={handleSaveAlertDays}
            style={({ pressed }) => [
              styles.alertSaveButton,
              { width: '100%', minHeight: 50 },
              savingAlertDays && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={theme.brandGradient}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={[styles.alertSaveButtonGradient, { minHeight: 48 }]}
            >
              <Text style={[styles.alertSaveButtonText, { fontSize: 15 }]}>
                {savingAlertDays ? 'Salvando...' : 'Salvar preferência'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  if (subMenu === 'legal') {
    return (
      <View style={styles.section}>
        <Pressable onPress={() => onSubMenuChange('main')} style={styles.backButton}>
          <AppIcon name="chevron-back" size={20} color={theme.ink} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <View style={styles.sectionHeaderBlock}>
          <Text style={styles.sectionTitle}>Informações Legais</Text>
          <Text style={styles.sectionSubtitle}>
            Documentacao legal, termos, privacidade e informacoes do sistema.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={{ gap: 12 }}>
            <SettingsLink
              icon="file-text-outline"
              label="Termos de uso"
              description="Direitos e deveres na utilizacao do Estokar."
              tone="slate"
              onPress={() => onNavigate('terms')}
            />

            <SettingsLink
              icon="shield-checkmark-outline"
              label="Privacidade"
              description="Como protegemos sua seguranca e informacoes."
              tone="emerald"
              onPress={() => onNavigate('privacy')}
            />

            <SettingsLink
              icon="information-circle-outline"
              label="Sobre o sistema"
              description="Conheca a historia e os criadores por tras da ferramenta."
              tone="indigo"
              onPress={() => onNavigate('about')}
            />

            <SettingsItem
              icon="smartphone-outline"
              label="Versao do sistema"
              value="v1.10.0 (Build 20260519)"
              tone="blue"
              onPress={() => setIsVersionModalVisible(true)}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.legalKicker}>INFORMACOES LEGAIS</Text>
          <Text style={styles.legalText}>
            O Estokar Inventory OS e uma plataforma de gerenciamento de inventario projetada
            para otimizacao de fluxos operacionais.
          </Text>
          <Text style={styles.legalText}>
            Ao utilizar este software, voce declara estar ciente de que a integridade dos
            dados inseridos e de responsabilidade da organizacao proprietaria da conta.
          </Text>
          <Text style={styles.legalFootnote}>
            © 2026 Estokar Inventory OS. Todos os direitos reservados.
          </Text>
        </View>

        <VersionModal visible={isVersionModalVisible} onClose={() => setIsVersionModalVisible(false)} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderBlock}>
        <Text style={styles.sectionTitle}>Configuracoes</Text>
        <Text style={styles.sectionSubtitle}>
          Gerencie as preferencias da plataforma e informacoes legais.
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSubMenuChange('stock')}
          style={({ pressed }) => [
            styles.settingsMenuCard,
            pressed && styles.pressed
          ]}
        >
          <View style={styles.settingsMenuCardLeft}>
            <View style={[styles.settingsMenuIconWrap, { backgroundColor: '#eff6ff' }]}>
              <AppIcon name="cube-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.settingsMenuCardText}>
              <Text style={styles.settingsMenuCardTitle}>Estoque e Alerta</Text>
              <Text style={styles.settingsMenuCardSubtitle}>
                Ajuste os dias de antecedencia para alertas de reposicao.
              </Text>
            </View>
          </View>
          <AppIcon name="chevron-forward" size={20} color={theme.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSubMenuChange('legal')}
          style={({ pressed }) => [
            styles.settingsMenuCard,
            pressed && styles.pressed
          ]}
        >
          <View style={styles.settingsMenuCardLeft}>
            <View style={[styles.settingsMenuIconWrap, { backgroundColor: '#f1f5f9' }]}>
              <AppIcon name="shield-checkmark-outline" size={24} color="#64748b" />
            </View>
            <View style={styles.settingsMenuCardText}>
              <Text style={styles.settingsMenuCardTitle}>Informações Legais</Text>
              <Text style={styles.settingsMenuCardSubtitle}>
                Termos de uso, privacidade, sobre e versao do sistema.
              </Text>
            </View>
          </View>
          <AppIcon name="chevron-forward" size={20} color={theme.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function TermsSection({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.section}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <AppIcon name="chevron-back" size={20} color={theme.ink} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>

      <View style={styles.legalPageHeader}>
        <Text style={styles.legalPageTitle}>Termos de Uso</Text>
        <Text style={styles.legalPageSubtitle}>Estokar Inventory OS</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.legalContent}>
          <LegalBlock title="1. Aceitacao dos Termos">
            Ao acessar e utilizar o Estokar Inventory OS, voce concorda em cumprir e estar vinculado aos seguintes termos e condicoes de uso. Este sistema e destinado exclusivamente para gestao de inventario e controle de estoque empresarial.
          </LegalBlock>

          <LegalBlock title="2. Responsabilidade do Usuario">
            O usuario e responsavel pela veracidade das informacoes inseridas no sistema, incluindo nomes de produtos, quantidades e categorias. O uso indevido do sistema para fins nao relacionados a gestao de estoque e estritamente proibido.
          </LegalBlock>

          <LegalBlock title="3. Controle de Acesso">
            As credenciais de acesso (email e senha) sao pessoais e intransferiveis. O usuario compromete-se a notificar a administracao imediatamente em caso de suspeita de uso nao autorizado de sua conta.
          </LegalBlock>

          <LegalBlock title="4. Funcionalidades do Sistema">
            O Estokar permite a criacao, edicao, exclusao e monitoramento de produtos e categorias, bem como o registro historico de entradas e saidas de mercadorias. A disponibilidade destas funcoes pode variar de acordo com o nivel de permissao do usuario.
          </LegalBlock>

          <LegalBlock title="5. Alteracoes nos Termos">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Alteracoes significativas serao comunicadas atraves do proprio sistema ou por email.
          </LegalBlock>
        </View>

        <Text style={styles.legalFootnote}>Ultima atualizacao: 22 de Abril de 2026</Text>
      </View>
    </View>
  );
}

function PrivacySection({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.section}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <AppIcon name="chevron-back" size={20} color={theme.ink} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>

      <View style={styles.legalPageHeader}>
        <Text style={styles.legalPageTitle}>Privacidade e Dados</Text>
        <Text style={styles.legalPageSubtitle}>Estokar Inventory OS</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.legalContent}>
          <LegalBlock title="1. Coleta de Dados">
            O Estokar coleta informacoes essenciais para o funcionamento da gestao de estoque, incluindo:
          </LegalBlock>
          <View style={styles.legalList}>
            <Text style={styles.legalListItem}>- Dados de Usuario: Nome, email e senha (criptografada).</Text>
            <Text style={styles.legalListItem}>- Dados de Inventario: Informacoes sobre produtos (nome, descricao, quantidade, imagem) e categorias.</Text>
            <Text style={styles.legalListItem}>- Historico de Movimentacao: Registros detalhados de todas as entradas e saidas de produtos, incluindo data e horario.</Text>
          </View>

          <LegalBlock title="2. Uso das Informacoes">
            Os dados coletados sao utilizados exclusivamente para:
          </LegalBlock>
          <View style={styles.legalList}>
            <Text style={styles.legalListItem}>- Gerar relatorios de estoque e movimentacao.</Text>
            <Text style={styles.legalListItem}>- Fornecer alertas de baixo estoque e sugerir reposicoes.</Text>
            <Text style={styles.legalListItem}>- Identificar o autor de cada alteracao no inventario para fins de auditoria interna.</Text>
          </View>

          <LegalBlock title="3. Protecao e Armazenamento">
            Todos os dados sao armazenados em servidores seguros e transmitidos via conexao criptografada (SSL/TLS). As senhas dos usuarios sao protegidas por algoritmos de hash de alta seguranca, impedindo o acesso mesmo por administradores do sistema.
          </LegalBlock>

          <LegalBlock title="4. Compartilhamento com Terceiros">
            O Estokar nao vende, aluga ou compartilha dados de inventario com terceiros para fins comerciais. O acesso aos dados e restrito aos usuarios autorizados pela organizacao contratante.
          </LegalBlock>
        </View>

        <Text style={styles.legalFootnote}>Compromisso com a LGPD e Seguranca da Informacao.</Text>
      </View>
    </View>
  );
}

function AboutSection({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.section}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <AppIcon name="chevron-back" size={20} color={theme.ink} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>

      <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}
      >
        <View style={styles.aboutLogo}>
          <AppIcon name="cube" size={40} color="#ffffff" />
        </View>
        <Text style={[styles.legalPageTitle, { marginTop: 16 }]}>Estokar Inventory OS</Text>
        <Text style={[styles.legalPageSubtitle, { color: theme.accent }]}>VERSAO 1.10.0</Text>

        <Text style={[styles.sectionSubtitle, { textAlign: 'center', marginTop: 16, paddingHorizontal: 20 }]}>
          Uma plataforma moderna e intuitiva desenhada para simplificar o controle de estoque de pequenas e medias empresas com foco em agilidade e precisao.
        </Text>

        <View style={styles.aboutGrid}>
          <AboutItem
            icon="flash-outline"
            title="Agilidade Real-time"
            description="Sincronizacao imediata entre web e mobile, garantindo que sua equipe sempre veja a quantidade exata em estoque."
          />
          <AboutItem
            icon="people-outline"
            title="Gestao Colaborativa"
            description="Controle de acesso por niveis, permitindo que multiplos colaboradores gerenciem o inventario com rastreabilidade total."
          />
          <AboutItem
            icon="phone-portrait-outline"
            title="Multi-Plataforma"
            description="Acesse de qualquer lugar via navegador ou utilize nosso aplicativo mobile para registros rapidos no deposito."
          />
          <AboutItem
            icon="cube-outline"
            title="Inteligencia de Dados"
            description="Alertas inteligentes de baixo estoque e dashboards operacionais que ajudam na tomada de decisao de compra."
          />
        </View>

        <View style={{ width: '100%', marginTop: 28 }}>
          <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Nossa Missao</Text>
          <Text style={styles.sectionSubtitle}>
            O Estokar nasceu da necessidade de transformar o controle de estoque, muitas vezes caotico e manual, em um processo digital transparente e livre de erros. Acreditamos que uma boa gestao de inventario e o coracao de uma operacao comercial saudavel.
          </Text>
        </View>
      </View>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  tone,
  value,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  tone?: 'blue' | 'slate' | 'emerald' | 'indigo';
  value: string;
  onPress?: () => void;
}) {
  const toneMap = {
    blue: { bg: '#eff6ff', text: '#2563eb' },
    slate: { bg: '#f1f5f9', text: '#64748b' },
    emerald: { bg: '#ecfdf3', text: '#10b981' },
    indigo: { bg: '#eef2ff', text: '#6366f1' },
  } as const;

  const colors = toneMap[tone ?? 'blue'];

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsItemCard, pressed && onPress && styles.pressed]}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.settingsIconWrap, { backgroundColor: colors.bg }]}>
          <AppIcon name={icon} size={20} color={colors.text} />
        </View>
        <View style={styles.settingsItemTextWrap}>
          <Text style={styles.settingsItemLabel}>{label}</Text>
          <Text style={styles.settingsItemValueInline}>{value}</Text>
          <Text style={styles.settingsItemMeta}>Estokar Inventory OS</Text>
        </View>
      </View>
      {onPress ? <AppIcon name="chevron-forward" size={16} color={theme.muted} /> : null}
    </Pressable>
  );
}

function SettingsLink({
  icon,
  label,
  description,
  tone,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  description: string;
  tone?: 'blue' | 'slate' | 'emerald' | 'indigo';
  onPress: () => void;
}) {
  const toneMap = {
    blue: { bg: '#eff6ff', text: '#2563eb' },
    slate: { bg: '#f1f5f9', text: '#64748b' },
    emerald: { bg: '#ecfdf3', text: '#10b981' },
    indigo: { bg: '#eef2ff', text: '#6366f1' },
  } as const;

  const colors = toneMap[tone ?? 'slate'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsLink, pressed && styles.pressed]}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.settingsIconWrap, { backgroundColor: colors.bg }]}>
          <AppIcon name={icon} size={20} color={colors.text} />
        </View>
        <View style={styles.settingsLinkText}>
          <Text style={styles.settingsItemLabel}>{label}</Text>
          <Text style={styles.settingsItemMeta}>{description}</Text>
        </View>
      </View>
      <AppIcon name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}

type VersionChange = {
  type: 'feature' | 'fix' | 'improvement';
  text: string;
};

type VersionEntry = {
  version: string;
  date: string;
  changes: VersionChange[];
};

const versionChangelog: VersionEntry[] = [
  {
    version: 'v1.11.0',
    date: '18 de Junho, 2026',
    changes: [
      {
        type: 'improvement',
        text: 'Implementada exportação de dados em formato CSV.',
      },
    ],
  },
];


function VersionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <View style={styles.versionModal}>
          <View style={styles.versionModalHeader}>
            <View>
              <Text style={styles.versionModalKicker}>Historico de Sistema</Text>
              <Text style={styles.versionModalTitle}>Notas de Atualizacao</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.versionModalClose}>
              <AppIcon name="close" size={18} color={theme.muted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <View style={{ gap: 20 }}>
              {versionChangelog.map((entry) => (
                <View key={entry.version} style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.versionEntryTitle}>{entry.version}</Text>
                    <View style={styles.versionEntryBadge}>
                      <Text style={styles.versionEntryBadgeText}>{entry.date}</Text>
                    </View>
                  </View>

                  <View style={{ gap: 10 }}>
                    {entry.changes.map((change, index) => (
                      <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={styles.versionEntryIcon}>
                          {change.type === 'feature' ? (
                            <Rocket size={14} color={theme.ok} />
                          ) : change.type === 'fix' ? (
                            <Bug size={14} color={theme.critical} />
                          ) : (
                            <Zap size={14} color={theme.accent} />
                          )}
                        </View>
                        <Text style={styles.versionEntryText}>{change.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.versionModalButton}>
            <LinearGradient
              colors={theme.brandGradient}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.versionModalButtonGradient}>
              <Text style={styles.versionModalButtonText}>Entendi, obrigado!</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LegalBlock({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 15, fontWeight: '900', color: theme.ink }}>{title}</Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: theme.muted }}>{children}</Text>
    </View>
  );
}

function AboutItem({
  icon,
  title,
  description,
}: {
  icon: AppIconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.aboutItem}>
      <View style={styles.aboutIcon}>
        <AppIcon name={icon} size={18} color={theme.accent} />
      </View>
      <View style={styles.aboutText}>
        <Text style={styles.aboutTitle}>{title}</Text>
        <Text style={styles.aboutDescription}>{description}</Text>
      </View>
    </View>
  );
}

const shadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.02,
  shadowRadius: 2,
};

const elevatedShadow = {
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.04,
  shadowRadius: 30,
};

const styles = StyleSheet.create({
  addProductButton: { alignItems: 'center', alignSelf: 'flex-end', borderRadius: 12, overflow: 'hidden' },
  addProductButtonGradient: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44, paddingHorizontal: 18 },
  addProductButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  authDivider: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 4 },
  authDividerLine: { backgroundColor: theme.stroke, flex: 1, height: 1 },
  authDividerText: { color: theme.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  authFooter: { alignItems: 'center', gap: 8, marginTop: 6 },
  authFooterAction: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18 },
  authFooterActionText: { color: theme.accent, fontSize: 14, fontWeight: '800' },
  authFooterText: { color: theme.muted, fontSize: 13, textAlign: 'center' },
  authHeader: { alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  authBrandRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  authBrandIcon: { alignItems: 'center', justifyContent: 'center', height: 56, width: 56, borderRadius: 16, backgroundColor: theme.ink },
  authBrandText: { gap: 4 },
  authBrandEyebrow: { color: theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  authBrandTitle: { color: theme.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  authHelper: { color: theme.muted, fontSize: 15, lineHeight: 22 },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 16 },
  backButtonText: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  alertCard: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, flexDirection: 'row', gap: 12, minHeight: 66, padding: 12, borderWidth: 1, borderColor: theme.stroke },
  alertInfo: { flex: 1 },
  alertList: { gap: 10, marginTop: 16 },
  alertText: { color: theme.muted, fontSize: 13, marginTop: 2 },
  alertTitle: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  alertInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertInput: { flex: 1, backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, color: theme.ink, fontSize: 14, fontWeight: '600', minHeight: 44, paddingHorizontal: 16 },
  settingsAlertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingsAlertInfo: { flex: 1, marginRight: 12 },
  settingsAlertTitle: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  settingsAlertSubtitle: { color: theme.muted, fontSize: 12, marginTop: 2 },
  settingsAlertInput: { minWidth: 60, textAlign: 'center' },
  settingsAlertSuffix: { color: theme.ink, fontSize: 14, fontWeight: '600' },
  alertSaveButton: { borderRadius: 12, overflow: 'hidden', minHeight: 44, minWidth: 110 },
  alertSaveButtonGradient: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 16 },
  alertSaveButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  appHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 80, paddingHorizontal: 20 },
  appSafeArea: { backgroundColor: theme.bg, flex: 1 },
  appShell: { flex: 1 },
  authCard: { ...elevatedShadow, backgroundColor: theme.card, borderRadius: 24, gap: 18, padding: 32, borderWidth: 1, borderColor: theme.stroke },
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  authMessage: { color: theme.critical, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  authSafeArea: { backgroundColor: theme.bg, flex: 1 },
  avatarButton: { alignItems: 'center', backgroundColor: theme.ink, borderRadius: 16, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8 },
  cancelButton: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.stroke, flex: 1, justifyContent: 'center', minHeight: 52 },
  cancelButtonText: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  cardSubtitle: { color: theme.muted, fontSize: 13, fontWeight: '600', marginTop: 4 },
  cardTitle: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  chart: { gap: 16, marginTop: 20 },
  chartBar: { backgroundColor: theme.accent, borderRadius: 99, height: 8 },
  chartGroupLabel: { color: theme.ok, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  chartLabel: { color: theme.muted, fontSize: 14, fontWeight: '700' },
  chartRow: { gap: 4 },
  chartTrack: { backgroundColor: theme.soft, borderRadius: 99, flex: 1, flexDirection: 'row', height: 8, overflow: 'hidden' },
  chartValue: { fontSize: 14, fontWeight: '800' },
  categoryInput: { backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, color: theme.ink, flex: 1, fontSize: 14, fontWeight: '500', minHeight: 48, paddingHorizontal: 16 },
  categoryModalSheet: { alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: 24, gap: 18, padding: 34, paddingBottom: 36, width: '92%', maxWidth: 520 },
  categoryModalTitle: { color: theme.ink, fontSize: 20, fontWeight: '700' },
  categoryCancelButton: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.stroke, flex: 1, justifyContent: 'center', minHeight: 44 },
  categoryCancelButtonText: { color: theme.ink, fontSize: 13, fontWeight: '700' },
  categorySaveButtonLarge: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 44, overflow: 'hidden' },
  categorySaveButtonGradient: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 44, width: '100%' },
  categorySaveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  categorySaveButton: { alignItems: 'center', backgroundColor: theme.accent, borderRadius: 16, height: 48, justifyContent: 'center', width: 48 },
  chipPressable: { borderRadius: 999 },
  chip: { alignItems: 'center', borderColor: theme.stroke, borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 36, paddingHorizontal: 16 },
  chipGradient: { borderColor: 'rgba(255,255,255,0.25)' },
  chipText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  content: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 10 },
  createProductTitle: { color: theme.ink, fontSize: 20, fontWeight: '700' },
  criticalText: { color: theme.critical },
  deleteProductButton: { alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.critical, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52 },
  deleteAccountButton: { alignItems: 'center', backgroundColor: '#fff1f2', borderColor: '#fecdd3', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 12 },
  deleteAccountButtonText: { color: theme.critical, fontSize: 13, fontWeight: '800' },
  dangerPanel: { borderColor: '#fecdd3', backgroundColor: '#fff7f9' },
  dangerText: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 12, marginBottom: 16 },
  dangerTitle: { color: theme.critical, fontSize: 18, fontWeight: '800' },
  deleteProductButtonText: { color: theme.critical, fontSize: 14, fontWeight: '700' },
  descriptionInput: { minHeight: 100, paddingTop: 16, textAlignVertical: 'top' },
  detailsModal: { backgroundColor: '#ffffff', borderRadius: 28, maxHeight: '92%', padding: 20, width: '94%', maxWidth: 720 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  detailsHeaderActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  detailsPrimaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 12, backgroundColor: theme.ink },
  detailsPrimaryButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  detailsIconButton: { alignItems: 'center', justifyContent: 'center', height: 36, width: 36, borderRadius: 12, borderWidth: 1, borderColor: theme.stroke, backgroundColor: theme.surface },
  detailsTitle: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  detailsSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  detailsNotice: { backgroundColor: theme.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.stroke, marginBottom: 12 },
  detailsNoticeText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  detailsLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  detailsLoadingText: { color: theme.muted, fontSize: 14, fontWeight: '700' },
  detailsHero: { flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'center' },
  detailsImageWrap: { height: 96, width: 96, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.stroke },
  detailsHeroText: { flex: 1 },
  detailsBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  detailsBadgeNeutral: { backgroundColor: theme.soft, color: theme.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  detailsBadgeCategory: { backgroundColor: theme.accentSoft, color: theme.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  detailsBadgeStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  detailsProductName: { color: theme.ink, fontSize: 20, fontWeight: '800' },
  detailsDescription: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  detailsPanel: { backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: theme.stroke, padding: 16, marginBottom: 16 },
  detailsPanelHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  detailsPanelKicker: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  detailsPanelTitle: { color: theme.ink, fontSize: 18, fontWeight: '800', marginTop: 6 },
  detailsAverageCard: { backgroundColor: theme.soft, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  detailsAverageLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  detailsAverageValue: { color: theme.ink, fontSize: 18, fontWeight: '800', marginTop: 4 },
  detailsChartWrap: { backgroundColor: theme.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.stroke },
  detailsChartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  detailsChartKicker: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.6 },
  detailsChartBadge: { backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.stroke },
  detailsChartBadgeText: { color: theme.muted, fontSize: 10, fontWeight: '700' },
  detailsChartBarGrid: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  detailsChartBarItem: { alignItems: 'center', width: 52 },
  detailsChartBarTrack: { height: 140, width: 20, borderRadius: 999, backgroundColor: '#e2e8f0', justifyContent: 'flex-end', overflow: 'hidden' },
  detailsChartBarFill: { width: '100%', borderRadius: 999, backgroundColor: theme.accent },
  detailsChartLabel: { color: theme.muted, fontSize: 9, marginTop: 6, textAlign: 'center' },
  detailsGrid: { gap: 12 },
  detailsMetricList: { gap: 10, marginTop: 12 },
  detailsMetricCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.stroke, padding: 10 },
  detailsMetricIcon: { height: 32, width: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailsMetricLabel: { color: theme.muted, fontSize: 11, fontWeight: '700' },
  detailsMetricValue: { color: theme.ink, fontSize: 14, fontWeight: '800', marginTop: 4 },
  detailsInfoList: { gap: 12, marginTop: 12 },
  detailsInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsInfoIcon: { height: 32, width: 32, borderRadius: 12, backgroundColor: theme.soft, alignItems: 'center', justifyContent: 'center' },
  detailsInfoText: { flex: 1 },
  detailsInfoLabel: { color: theme.muted, fontSize: 11, fontWeight: '700' },
  detailsInfoValue: { color: theme.ink, fontSize: 13, fontWeight: '800', marginTop: 2 },
  detailsHistoryHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  detailsHistoryBadge: { backgroundColor: theme.soft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 10, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  detailsHistoryList: { gap: 16 },
  detailsHistoryGroup: { gap: 10 },
  detailsHistoryGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailsHistoryGroupLabel: { backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.stroke, fontSize: 10, fontWeight: '800', color: theme.muted, textTransform: 'uppercase', letterSpacing: 1.2 },
  detailsHistoryDivider: { height: 1, flex: 1, backgroundColor: theme.stroke },
  detailsHistoryTimeline: { borderLeftWidth: 1, borderLeftColor: theme.stroke, paddingLeft: 22, gap: 12 },
  detailsHistoryItem: { position: 'relative' },
  detailsHistoryDot: { position: 'absolute', left: -14, top: 18, height: 10, width: 10, borderRadius: 999 },
  detailsHistoryDotIn: { backgroundColor: theme.ok },
  detailsHistoryDotOut: { backgroundColor: theme.critical },
  detailsHistoryCard: { backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.stroke, padding: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailsHistoryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  detailsHistoryIcon: { height: 40, width: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailsHistoryIconIn: { backgroundColor: theme.okSoft },
  detailsHistoryIconOut: { backgroundColor: theme.criticalSoft },
  detailsHistoryTitle: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  detailsHistoryMeta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  detailsHistoryCardRight: { alignItems: 'flex-end', justifyContent: 'center' },
  detailsHistoryAmount: { fontSize: 16, fontWeight: '800' },
  detailsHistoryAmountIn: { color: theme.ok },
  detailsHistoryAmountOut: { color: theme.critical },
  detailsHistoryAmountLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  detailsEmptyPanel: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: theme.stroke, backgroundColor: theme.surface, paddingVertical: 24, gap: 6 },
  detailsEmptyTitle: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  detailsEmptySubtitle: { color: theme.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  editorForm: { gap: 16, paddingBottom: 16 },
  editorLayer: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 8 },
  editorSheet: { backgroundColor: '#ffffff', borderRadius: 28, maxHeight: '96%', padding: 24, width: '94%', maxWidth: 590 },
  editorSubtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
  emptyHeader: { color: theme.ink, fontSize: 15, fontWeight: '800', marginTop: 5 },
  emptyText: { color: theme.muted, fontSize: 14, textAlign: 'center', marginTop: 5 },
  entryButton: { alignItems: 'center', backgroundColor: theme.okSoft, borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: 40 },
  entryButtonText: { color: theme.ok, fontSize: 14, fontWeight: '700' },
  exitButton: { alignItems: 'center', backgroundColor: theme.criticalSoft, borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: 40 },
  exitButtonText: { color: theme.critical, fontSize: 14, fontWeight: '700' },
  field: { gap: 10 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  forgotLinkButton: { paddingHorizontal: 6, paddingVertical: 6 },
  forgotLink: { color: theme.accent, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  formCloseButton: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  formHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  ghostButton: { alignItems: 'center', borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 40 },
  ghostButtonText: { color: theme.ink, fontSize: 13, fontWeight: '700' },
  googleButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 56 },
  googleButtonText: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  googleBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  googleMark: { color: '#4285F4', fontSize: 20, fontWeight: '900' },
  headerEyebrow: { color: theme.muted, fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5 },
  headerIconButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  headerTitle: { color: theme.ink, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  heroAccent: { backgroundColor: theme.accent, borderRadius: 100, height: 150, opacity: 0.1, position: 'absolute', right: -40, top: -40, width: 150 },
  heroGlowPrimary: { backgroundColor: 'rgba(59, 130, 246, 0.18)', borderRadius: 999, height: 220, position: 'absolute', right: -70, top: -90, width: 220 },
  heroGlowSecondary: { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderRadius: 999, height: 180, left: -60, position: 'absolute', bottom: -80, width: 180 },
  heroBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.12)', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  heroBadgeText: { color: '#cbd5f5', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  heroKicker: { color: theme.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  heroPanel: { ...elevatedShadow, borderRadius: 28, overflow: 'hidden', padding: 24, gap: 12 },
  heroSubtitle: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 320 },
  heroSubtitleHighlight: { color: '#ffffff', fontWeight: '800' },
  heroTitle: { color: '#ffffff', fontSize: 30, fontWeight: '800', lineHeight: 36, marginTop: 8, letterSpacing: -1 },
  heroTitleMuted: { fontSize: 18, color: '#94a3b8', fontWeight: '500' },
  heroButton: { alignSelf: 'flex-start', borderRadius: 14, overflow: 'hidden', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroButtonInner: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44, paddingHorizontal: 16 },
  heroButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  iconButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  imageModal: { backgroundColor: '#ffffff', borderRadius: 24, gap: 12, padding: 24, width: '100%', maxWidth: 520 },
  imageModalAction: { alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 16 },
  imageModalActionText: { color: theme.ink, fontSize: 14, fontWeight: '700' },
  imageModalTitle: { color: theme.ink, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  imagePickerButton: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 16, minHeight: 96, padding: 16 },
  imagePickerSubtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
  imagePickerTextBlock: { flex: 1 },
  imagePickerTitle: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  infoLabel: { color: theme.muted, fontSize: 15, fontWeight: '500' },
  infoRow: { alignItems: 'center', borderBottomColor: theme.stroke, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 64 },
  infoValue: { color: theme.ink, fontSize: 15, fontWeight: '700' },
  infoCardItem: { backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  infoCardLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  infoCardList: { gap: 12, marginTop: 16 },
  infoCardValue: { color: theme.ink, fontSize: 14, fontWeight: '800', marginTop: 6 },
  inlineField: { flex: 1 },
  inlineInputs: { flexDirection: 'row', gap: 12 },
  input: { backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, color: theme.ink, fontSize: 15, fontWeight: '600', minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 },
  inputFocused: { borderColor: '#3b82f6', backgroundColor: '#ffffff' },
  keyboardView: { flex: 1 },
  label: { color: theme.ink, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  legalFootnote: { color: theme.muted, fontSize: 10, fontWeight: '700', marginTop: 16, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
  legalKicker: { color: theme.ink, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  legalPageHeader: { gap: 6 },
  legalPageTitle: { color: theme.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  legalPageSubtitle: { color: theme.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  legalText: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  legalList: { gap: 6, marginTop: 6, marginBottom: 6 },
  legalListItem: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  legalContent: { gap: 24, marginTop: 32 },
  legalSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  legalTitle: { color: theme.ink, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  aboutLogo: { alignItems: 'center', justifyContent: 'center', height: 80, width: 80, borderRadius: 28, backgroundColor: theme.ink, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  aboutGrid: { width: '100%', gap: 16, marginTop: 32 },
  aboutItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  aboutIcon: { height: 36, width: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft },
  aboutText: { flex: 1 },
  aboutTitle: { color: theme.ink, fontSize: 14, fontWeight: '800' },
  aboutDescription: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  loadingScreen: { alignItems: 'center', flex: 1, justifyContent: 'center', backgroundColor: theme.bg },
  loadingText: { color: theme.ink, fontSize: 20, fontWeight: '800', marginTop: 16 },
  logo: { ...elevatedShadow, alignItems: 'center', backgroundColor: theme.ink, justifyContent: 'center', marginBottom: 20, position: 'relative' },
  logoLetter: { color: '#FFFFFF', fontWeight: '800' },
  logoMark: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderWidth: 1, bottom: -6, justifyContent: 'center', position: 'absolute', right: -6 },
  logoutButton: { alignItems: 'center', backgroundColor: theme.ink, borderRadius: 12, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 48 },
  logoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  metricCard: { ...shadow, backgroundColor: theme.card, borderRadius: 24, flex: 1, minHeight: 120, padding: 16, borderWidth: 1, borderColor: theme.stroke },
  metricIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', marginBottom: 12, width: 40 },
  metricLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  metricHelper: { color: theme.muted, fontSize: 11, fontWeight: '600', marginTop: 4 },
  metricValue: { color: theme.ink, fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricsGridTwo: { flexDirection: 'row', gap: 12 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  modalButtonRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  modalSheetWrap: { width: '100%', alignItems: 'center' },
  modalCancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  modalCancelText: { color: theme.muted, fontSize: 14, fontWeight: '700' },
  modalHandle: { display: 'none' },
  modalLayer: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 16 },
  movementAmount: { fontSize: 24, fontWeight: '800', letterSpacing: -1 },
  movementAmountIn: { color: theme.ok },
  movementAmountOut: { color: theme.critical },
  movementDate: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  movementEditor: { backgroundColor: theme.surface, borderRadius: 16, gap: 16, padding: 16 },
  movementIcon: { alignItems: 'center', borderRadius: 12, height: 48, justifyContent: 'center', width: 48 },
  movementIn: { backgroundColor: theme.okSoft },
  movementInfo: { flex: 1, minWidth: 0 },
  movementList: { gap: 12, marginTop: 20 },
  movementOut: { backgroundColor: theme.criticalSoft },
  movementProduct: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  movementRow: { ...shadow, alignItems: 'center', backgroundColor: theme.card, borderRadius: 24, flexDirection: 'row', gap: 16, minHeight: 80, padding: 20, borderWidth: 1, borderColor: theme.stroke },
  movementRowCompact: { padding: 14, gap: 12, borderRadius: 20 },
  movementAmountWrap: { alignItems: 'flex-end', minWidth: 56 },
  movementAmountCompact: { fontSize: 20 },
  dashboardEmpty: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: theme.stroke, backgroundColor: '#ffffff', paddingVertical: 24, paddingHorizontal: 16 },
  dashboardEmptyIcon: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.soft, borderRadius: 999, height: 56, width: 56, marginBottom: 10 },
  dashboardEmptyTitle: { color: theme.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  dashboardEmptyText: { color: theme.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  rankingList: { gap: 12 },
  rankingCard: { backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.stroke, padding: 14 },
  rankingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  rankingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rankingBadge: { height: 28, width: 28, borderRadius: 999, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rankingBadgeText: { color: theme.accent, fontSize: 12, fontWeight: '800' },
  rankingInfo: { flex: 1 },
  rankingTitle: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  rankingMeta: { color: theme.muted, fontSize: 11, marginTop: 2 },
  rankingRight: { alignItems: 'flex-end' },
  rankingValue: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  rankingTrack: { backgroundColor: theme.soft, borderRadius: 999, height: 8, overflow: 'hidden' },
  rankingBar: { backgroundColor: theme.accent, borderRadius: 999, height: '100%' },
  alertRows: { gap: 12 },
  alertRow: { alignItems: 'center', flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.stroke, padding: 12 },
  alertRowIcon: { height: 40, width: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertRowIconCritical: { backgroundColor: '#fee2e2' },
  alertRowIconLow: { backgroundColor: '#ffedd5' },
  alertRowInfo: { flex: 1 },
  alertRowTitle: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  alertRowMeta: { color: theme.muted, fontSize: 11, marginTop: 2 },
  alertRowRight: { alignItems: 'flex-end' },
  alertRowStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  alertRowStatusCritical: { color: theme.critical },
  alertRowStatusLow: { color: theme.low },
  alertRowThreshold: { color: theme.muted, fontSize: 11, marginTop: 2 },
  noPhotoBox: { alignItems: 'center', backgroundColor: theme.soft, borderRadius: 20, justifyContent: 'center' },
  panel: { ...shadow, backgroundColor: theme.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.stroke },
  panelHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  panelBadge: { backgroundColor: theme.soft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  panelBadgeText: { color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' },
  passwordField: { alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingLeft: 16, paddingRight: 8 },
  passwordInput: { color: theme.ink, flex: 1, fontSize: 15, minHeight: 44 },
  pressed: { opacity: 0.7 },
  primaryButton: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 52, overflow: 'hidden' },
  primaryButtonGradient: { alignItems: 'center', borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: 52, width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  productCard: { ...shadow, backgroundColor: theme.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.stroke },
  productCardPressed: { opacity: 0.9, backgroundColor: '#ffffff' },
  productCardTop: { flexDirection: 'row', gap: 18 },
  productImageContainer: { height: 72, width: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.surface },
  productMainInfo: { flex: 1 },
  productHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  productTitleBlock: { flex: 1, gap: 4 },
  productMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  productCategoryTag: { color: theme.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: theme.stroke },
  statusTag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  productName: { color: theme.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  productDescription: { color: theme.muted, fontSize: 12, marginTop: 2 },
  productQuantityBlock: { alignItems: 'flex-end' },
  productQuantityValue: { fontSize: 18, fontWeight: '800', color: theme.accent, letterSpacing: -0.6 },
  productQuantityLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: theme.muted, letterSpacing: 1 },
  productCardFooter: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.stroke },
  productActionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  entryButtonAction: { backgroundColor: theme.okSoft },
  exitButtonAction: { backgroundColor: theme.criticalSoft },
  entryActionText: { fontSize: 12, fontWeight: '800', color: theme.ok },
  exitActionText: { fontSize: 12, fontWeight: '800', color: theme.critical },
  productCategory: { color: theme.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  productForecast: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  productImage: { backgroundColor: theme.soft, borderRadius: 16 },
  productInfo: { flex: 1, gap: 4 },
  productList: { gap: 12 },
  productMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  productQuantity: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  productTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  productsHeader: { alignItems: 'flex-start', flexDirection: 'column', gap: 12, marginBottom: 8 },
  productsHeaderText: { flex: 1, gap: 6 },
  productsFiltersPanel: { ...shadow, backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.stroke, padding: 16, gap: 12 },
  profileAvatar: { alignItems: 'center', backgroundColor: theme.ink, borderRadius: 48, height: 96, justifyContent: 'center', marginBottom: 20, width: 96 },
  profileAvatarText: { color: '#2563eb', fontSize: 34, fontWeight: '800' },
  profileAvatarLarge: { alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 52, borderColor: '#ffffff', borderWidth: 4, height: 104, justifyContent: 'center', marginBottom: 16, width: 104 },
  profileEmail: { color: theme.muted, fontSize: 16, marginTop: 6 },
  profileMetaCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 12, flex: 1 },
  profileMetaGrid: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  profileMetaLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  profileMetaValue: { color: theme.ink, fontSize: 12, fontWeight: '800', marginTop: 6 },
  profileName: { color: theme.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  profileRole: { color: theme.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  profileStatusDot: { backgroundColor: '#10b981', borderRadius: 6, height: 8, width: 8 },
  profileStatusRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 6 },
  profileStatusText: { color: '#059669', fontSize: 12, fontWeight: '800' },
  profileSummaryCard: { ...elevatedShadow, alignItems: 'center', backgroundColor: theme.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.stroke },
  saveButton: { alignItems: 'center', borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 52, overflow: 'hidden' },
  saveButtonGradient: { alignItems: 'center', borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 52, width: '100%' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  searchBox: { alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.stroke, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 16 },
  searchInput: { color: theme.ink, flex: 1, fontSize: 14, fontWeight: '600' },
  section: { gap: 24 },
  sectionHeaderBlock: { gap: 6 },
  sectionHeader: { gap: 4 },
  sectionSubtitle: { color: theme.muted, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: theme.ink, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  segmentButton: { alignItems: 'center', borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: 42 },
  segmentButtonActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: theme.muted, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: theme.ink },
  segmentedControl: { backgroundColor: theme.soft, borderRadius: 16, flexDirection: 'row', gap: 4, padding: 4 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingsItemCard: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: theme.stroke, flexDirection: 'row', justifyContent: 'space-between', padding: 14, gap: 12 },
  settingsItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  settingsItemTextWrap: { flex: 1, minWidth: 0 },
  settingsItemLabel: { color: theme.ink, fontSize: 14, fontWeight: '800' },
  settingsItemValueInline: { color: theme.accent, fontSize: 12, fontWeight: '800', marginTop: 4 },
  settingsItemMeta: { color: theme.muted, fontSize: 12, marginTop: 4 },
  settingsIconWrap: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingsLink: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16 },
  settingsLinkText: { flex: 1, paddingRight: 12 },
  settingsMenuCard: { alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 22, borderWidth: 1, borderColor: theme.stroke, flexDirection: 'row', justifyContent: 'space-between', padding: 18, gap: 16, ...shadow },
  settingsMenuCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 },
  settingsMenuCardText: { flex: 1, minWidth: 0, gap: 4 },
  settingsMenuCardTitle: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  settingsMenuCardSubtitle: { color: theme.muted, fontSize: 12, lineHeight: 16 },
  settingsMenuIconWrap: { height: 52, width: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detailsChartEmpty: { height: 145, alignItems: 'center', justifyContent: 'center' },
  detailsChartEmptyText: { color: theme.muted, fontSize: 12 },
  sidebar: { ...elevatedShadow, borderBottomRightRadius: 24, borderTopRightRadius: 24, gap: 18, height: '100%', paddingHorizontal: 22, paddingTop: 28, width: 280 },
  sidebarBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sidebarBrand: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 18 },
  sidebarBrandText: { gap: 2 },
  sidebarEyebrow: { color: 'rgba(191, 219, 254, 0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 2.2 },
  sidebarLogo: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', height: 40, justifyContent: 'center', width: 40 },
  sidebarNav: { gap: 6 },
  sidebarItem: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 12, minHeight: 48, paddingHorizontal: 14 },
  sidebarItemActive: { backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)' },
  sidebarItemText: { color: 'rgba(203, 213, 225, 0.82)', fontSize: 14, fontWeight: '600' },
  sidebarItemTextActive: { color: '#ffffff' },
  sidebarLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  sidebarSubtitle: { color: 'rgba(226, 232, 240, 0.8)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  sidebarTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  statusDot: { borderRadius: 8, height: 16, width: 16 },
  stockPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  stockPillText: { fontSize: 10, fontWeight: '700' },
  timeline: { gap: 16, paddingLeft: 24, position: 'relative' },
  timelineLine: { backgroundColor: theme.stroke, bottom: 0, left: 12, position: 'absolute', top: 0, width: 2 },
  timelineItem: { paddingLeft: 16, position: 'relative' },
  timelineDot: { borderRadius: 6, height: 12, left: 12, position: 'absolute', top: '50%', transform: [{ translateX: -6 }, { translateY: -6 }], width: 12, zIndex: 10 },
  timelineDotIn: { backgroundColor: theme.ok },
  timelineDotOut: { backgroundColor: theme.critical },
  versionModal: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, width: '92%', maxWidth: 520, gap: 16 },
  versionModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  versionModalKicker: { color: theme.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  versionModalTitle: { color: theme.ink, fontSize: 20, fontWeight: '800' },
  versionModalClose: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.stroke, height: 40, width: 40 },
  versionEntryTitle: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  versionEntryBadge: { backgroundColor: theme.soft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  versionEntryBadgeText: { color: theme.accent, fontSize: 10, fontWeight: '800' },
  versionEntryIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: theme.soft, alignItems: 'center', justifyContent: 'center' },
  versionEntryText: { color: theme.muted, fontSize: 13, lineHeight: 18, flex: 1 },
  versionModalButton: { borderRadius: 16, overflow: 'hidden' },
  versionModalButtonGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  versionModalButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
