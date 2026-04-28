import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoAuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
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
  updateProduct as updateRemoteProduct,
} from '@/src/shared/api/products';
import { getGoogleOAuthUrl, getProfile, login, register } from '@/src/shared/api/auth';
import { deleteMyAccount } from '@/src/shared/api/users';
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
import type {
  AuthSession,
  Category,
  CreateProductInput,
  Product,
  StockMovement,
  UpdateProductInput,
} from '@/src/shared/types/domain';

type AuthMode = 'login' | 'register';
type AppSection = 'home' | 'products' | 'history' | 'profile' | 'settings' | 'terms' | 'privacy' | 'about';
const NO_PHOTO_IMAGE = 'sem-foto';

WebBrowser.maybeCompleteAuthSession();

const theme = {
  accent: '#3b82f6',
  accentSoft: '#eff6ff',
  bg: '#f5f7fb',
  card: '#f8fafc',
  critical: '#ef4444',
  criticalSoft: '#fee2e2',
  ink: '#0f172a',
  low: '#f59e0b',
  lowSoft: '#fef3c7',
  muted: '#64748b',
  ok: '#10b981',
  okSoft: '#d1fae5',
  soft: '#eef2f6',
  stroke: '#e2e8f0',
  surface: '#f8fafc',
  surface2: '#f8fafc',
  brandGradient: ['#0b1220', '#101d33', '#1f3a70'],
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
      setSession(await getSession());
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
    } catch (error) {
      const storedSession = await getSession();
      if (storedSession) {
        setSession(storedSession);
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
  }

  async function handleDeleteAccount() {
    if (!session) return;

    await deleteMyAccount(session.accessToken);
    await clearLocalInventoryData();
    await clearSession();
    setSession(null);
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
        typeof parsed.queryParams?.access_token === 'string'
          ? parsed.queryParams.access_token
          : '';

      const refreshToken =
        typeof parsed.queryParams?.refresh_token === 'string'
          ? parsed.queryParams.refresh_token
          : '';


      if (!accessToken) {
        throw new Error('Nao foi possivel concluir o login com Google.');
      }

      const fallbackUser = {
        email: typeof parsed.queryParams?.email === 'string' ? parsed.queryParams.email : '',
        id: typeof parsed.queryParams?.id === 'string' ? parsed.queryParams.id : '',
        name: typeof parsed.queryParams?.name === 'string' ? parsed.queryParams.name : 'Usuario',
      };

      const profile = await getProfile(accessToken).catch(() => fallbackUser);
      const nextSession: AuthSession = {
        accessToken,
        refreshToken,
        user: {
          email: profile.email || fallbackUser.email,
          id: profile.id || fallbackUser.id,
          name: profile.name || fallbackUser.name,
        },
      };

      await saveSession(nextSession);
      setSession(nextSession);
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

  if (session) {
    return (
      <DashboardScreen
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
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
  session,
}: {
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
  session: AuthSession;
}) {
  const [section, setSection] = useState<AppSection>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const insights = useMemo(() => getInventoryInsights(products, movements), [products, movements]);

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

  async function handleCreateProduct(input: CreateProductInput) {
    try {
      await createRemoteProduct(session.accessToken, input);
    } catch {
      await createLocalProduct(input);
    } finally {
      await refreshProducts();
    }
  }

  async function handleUpdateProduct(product: Product, input: UpdateProductInput) {
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
            <HomeSection insights={insights} products={products} />
          ) : null}
          {section === 'products' ? (
            <ProductsSection
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onCreateProduct={handleCreateProduct}
              onDeleteCategory={handleDeleteCategory}
              onDeleteProduct={handleDeleteProduct}
              onMoveStock={handleMoveStock}
              onUpdateCategory={handleUpdateCategory}
              onUpdateProduct={handleUpdateProduct}
              products={products}
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
            <SettingsSection onNavigate={navigate} />
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
                <SidebarItem active={section === 'settings'} icon="settings-outline" label="Configuracoes" onPress={() => navigate('settings')} />
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
  products,
}: {
  insights: InventoryInsights;
  products: Product[];
}) {
  const operationalProducts = useMemo(() => getOperationalProducts(products), [products]);
  const maxQuantity = Math.max(
    ...[...operationalProducts.highest, ...operationalProducts.lowest].map((p) => p.quantity),
    1,
  );

  return (
    <View style={styles.section}>
      <LinearGradient
        colors={theme.brandGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.heroPanel}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroKicker}>Visao Geral Inteligente</Text>
        <Text style={styles.heroTitle}>
          {insights.totalStock.toLocaleString()}{' '}
          <Text style={styles.heroTitleMuted}>itens em estoque</Text>
        </Text>
        <Text style={styles.heroSubtitle}>
          Ha{' '}
          <Text style={styles.heroSubtitleHighlight}>
            {insights.criticalProducts + insights.lowProducts}
          </Text>{' '}
          produtos que requerem sua atencao imediata hoje.
        </Text>
      </LinearGradient>

      <View style={styles.metricsGrid}>
        <MetricCard icon="cube" label="Total" value={String(products.length)} color="blue" />
        <MetricCard icon="alert-circle-outline" label="Baixo" value={String(insights.lowProducts)} color="orange" />
        <MetricCard icon="close-circle-outline" label="Faltando" value={String(insights.outOfStock)} color="red" />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="log-in-outline" label="Entradas" value={`+${insights.periodEntries}`} color="green" />
        <MetricCard icon="log-out-outline" label="Saidas" value={`-${insights.periodOutputs}`} color="slate" />
        <MetricCard icon="flame-outline" label="Destaque" value={insights.mostConsumedShort} color="purple" />
      </View>

      <View style={styles.panel}>
        <SectionHeading caption="Produtos com maior e menor volume" title="Visao operacional" />
        <View style={styles.chart}>
          {operationalProducts.highest.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.chartGroupLabel}>MAIORES ESTOQUES</Text>
              {operationalProducts.highest.map((product) => (
                <OperationalRow
                  key={product.id}
                  color={theme.ok}
                  maxQuantity={maxQuantity}
                  product={product}
                />
              ))}
            </View>
          )}

          {operationalProducts.lowest.length > 0 && (
            <View style={{ gap: 8, marginTop: 12 }}>
              <Text style={[styles.chartGroupLabel, { color: theme.critical }]}>MENORES ESTOQUES</Text>
              {operationalProducts.lowest.map((product) => (
                <OperationalRow
                  key={product.id}
                  color={theme.critical}
                  maxQuantity={maxQuantity}
                  product={product}
                />
              ))}
            </View>
          )}

          {!operationalProducts.highest.length && !operationalProducts.lowest.length ? (
            <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.panel}>
        <SectionHeading caption="Alertas de estoque critico" title="Acoes de Reposicao" />
        {insights.alerts.length ? (
          <View style={styles.alertList}>
            {insights.alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={[styles.statusDot, { backgroundColor: alert.color }]} />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.name}</Text>
                  <Text style={styles.alertText}>
                    Repor {alert.suggestedRestock} unidade(s). Acaba em {alert.daysLeftText}.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Tudo sob controle. Nenhum alerta critico agora.</Text>
        )}
      </View>
    </View>
  );
}

function ProductsSection({
  categories,
  onCreateCategory,
  onCreateProduct,
  onDeleteCategory,
  onDeleteProduct,
  onMoveStock,
  onUpdateCategory,
  onUpdateProduct,
  products,
}: {
  categories: Category[];
  onCreateCategory: (name: string) => Promise<void>;
  onCreateProduct: (product: CreateProductInput) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  onDeleteProduct: (product: Product) => Promise<void>;
  onMoveStock: (product: Product, type: StockMovement['type'], quantity: number) => Promise<void>;
  onUpdateCategory: (category: Category, name: string) => Promise<void>;
  onUpdateProduct: (product: Product, input: UpdateProductInput) => Promise<void>;
  products: Product[];
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryActionVisible, setCategoryActionVisible] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [form, setForm] = useState({
    category: '',
    categoryId: '',
    description: '',
    image: '',
    lowStockLimit: '5',
    name: '',
    quantity: '',
  });
  const [categoryDraft, setCategoryDraft] = useState('');

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, products, query]);

  useEffect(() => {
    const categoryNames = new Set(categories.map((category) => category.name));
    if (categoryFilter !== 'Todos' && !categoryNames.has(categoryFilter)) {
      setCategoryFilter('Todos');
    }

    const selectedCategoryExists = categories.some((category) => category.id === form.categoryId);
    if (!selectedCategoryExists && form.categoryId) {
      setForm((current) => ({
        ...current,
        category: '',
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
      category: '',
      categoryId: '',
      description: '',
      image: '',
      lowStockLimit: '5',
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
    setForm({
      category: product.category ?? '',
      categoryId: product.categoryId ?? categories.find((category) => category.name === product.category)?.id ?? '',
      description: product.description,
      image: product.image === NO_PHOTO_IMAGE ? '' : product.image,
      lowStockLimit: String(product.lowStockLimit),
      name: product.name,
      quantity: String(product.quantity),
    });
    setModalVisible(true);
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
    const lowStockLimit = Number(form.lowStockLimit);
    const category = form.category.trim();

    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(parsedQuantity)) {
      return;
    }

    const input = {
      category,
      categoryId: form.categoryId ? form.categoryId : null,
      description: form.description.trim(),
      image: form.image || NO_PHOTO_IMAGE,
      lowStockLimit: Number.isFinite(lowStockLimit) ? Math.max(Math.trunc(lowStockLimit), 1) : 5,
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
            onPress={() => openEditModal(product)}
            onMoveStock={(type) => onMoveStock(product, type, 1)}
          />
        ))}
      </View>
      <ProductEditorModal
        categories={categories}
        editingProduct={editingProduct}
        form={form}
        imageModalVisible={imageModalVisible}
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
    category: string;
    categoryId: string;
    description: string;
    image: string;
    lowStockLimit: string;
    name: string;
    quantity: string;
  };
  imageModalVisible: boolean;
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
                  <View style={styles.inlineField}>
                    <PremiumInput
                      keyboardType="number-pad"
                      label="Limite baixo"
                      onChangeText={(value) => onChangeForm('lowStockLimit', value)}
                      placeholder="5"
                      value={form.lowStockLimit}
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
                        onChangeForm('category', '');
                        onChangeForm('categoryId', '');
                      }}
                    />
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        active={form.categoryId === category.id}
                        label={category.name}
                        onPress={() => {
                          onChangeForm('category', category.name);
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
                    style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}>
                    <LinearGradient
                      colors={theme.brandGradient}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>Salvar</Text>
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

type ProductEditorModalProps = {
  form: {
    category: string;
    categoryId: string;
    description: string;
    image: string;
    lowStockLimit: string;
    name: string;
    quantity: string;
  };
};

function ProductCard({
  onPress,
  product,
  onMoveStock
}: {
  onPress: () => void;
  product: Product;
  onMoveStock?: (type: StockMovement['type']) => void;
}) {
  const status = getStockStatus(product);

  return (
    <Pressable
      accessibilityRole="button"
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
                <Text style={styles.productCategoryTag}>{product.category || 'Sem Categoria'}</Text>
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
  const visibleMovements = compact ? movements.slice(0, 5) : movements;

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

            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              {items.map((movement) => (
                <View key={movement.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, movement.type === 'in' ? styles.timelineDotIn : styles.timelineDotOut]} />
                  <View style={styles.movementRow}>
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
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.movementAmount, movement.type === 'in' ? styles.movementAmountIn : styles.movementAmountOut]}>
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
          <AppIcon name="receipt-outline" size={48} color={theme.stroke} />
          <Text style={styles.emptyText}>Nenhuma movimentacao registrada.</Text>
        </View>
      )}
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

      <View style={styles.profileSummaryCard}>
        <View style={styles.profileAvatarLarge}>
          <Text style={styles.profileAvatarText}>{getInitial(user.name)}</Text>
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileRole}>{user.role}</Text>

        <View style={styles.profileMetaGrid}>
          <View style={styles.profileMetaCard}>
            <Text style={styles.profileMetaLabel}>Desde</Text>
            <Text style={styles.profileMetaValue}>Abril de 2024</Text>
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
    </View>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.segmentButton, active && styles.segmentButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
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

  return (
    <Pressable
      accessibilityRole="button"
      delayLongPress={240}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chipPressable, pressed && styles.pressed]}>
      <LinearGradient
        colors={usesGradient ? theme.brandGradient : [theme.surface, theme.surface]}
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

function OperationalRow({ color, maxQuantity, product }: { color: string; maxQuantity: number; product: Product }) {
  const width = `${Math.max((product.quantity / maxQuantity) * 100, 5)}%`;
  return (
    <View style={styles.chartRow}>
      <View style={styles.chartHeader}>
        <Text numberOfLines={1} style={styles.chartLabel}>{product.name}</Text>
        <Text style={[styles.chartValue, { color }]}>{product.quantity} un.</Text>
      </View>
      <View style={styles.chartTrack}>
        <View
          style={[
            styles.chartBar,
            { backgroundColor: color, width },
          ]}
        />
      </View>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color = 'blue'
}: {
  icon: AppIconName;
  label: string;
  value: string;
  color?: 'blue' | 'orange' | 'red' | 'green' | 'slate' | 'purple';
}) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#3b82f6', border: '#dbeafe' },
    orange: { bg: '#fff7ed', text: '#f59e0b', border: '#ffedd5' },
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
    </View>
  );
}

function SectionHeading({ caption, title }: { caption: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{caption}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

type InventoryInsights = {
  alerts: { color: string; daysLeftText: string; id: string; name: string; suggestedRestock: number }[];
  criticalProducts: number;
  lowProducts: number;
  mostConsumedShort: string;
  outOfStock: number;
  periodEntries: number;
  periodOutputs: number;
  totalProducts: number;
  totalStock: number;
};

function getOperationalProducts(products: Product[]): { highest: Product[]; lowest: Product[] } {
  const highest = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  const selectedIds = new Set(highest.map((product) => product.id));

  const lowest = products
    .filter((product) => !selectedIds.has(product.id))
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 3);

  return { highest, lowest };
}

function getInventoryInsights(products: Product[], movements: StockMovement[]): InventoryInsights {
  const entries = movements.filter((movement) => movement.type === 'in');
  const outputs = movements.filter((movement) => movement.type === 'out');
  const consumedByProduct = outputs.reduce<Record<string, number>>((acc, movement) => {
    acc[movement.productName] = (acc[movement.productName] ?? 0) + movement.quantity;
    return acc;
  }, {});
  const mostConsumed =
    Object.entries(consumedByProduct).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nenhum';

  const alerts = products
    .filter((product) => getStockStatus(product).level !== 'ok')
    .map((product) => {
      const forecast = getProductForecast(product, movements);
      const status = getStockStatus(product);
      return {
        color: status.color,
        daysLeftText: forecast.daysLeftText,
        id: product.id,
        name: product.name,
        suggestedRestock: Math.max(product.lowStockLimit * 2 - product.quantity, product.lowStockLimit),
      };
    });

  return {
    alerts,
    criticalProducts: products.filter((product) => getStockStatus(product).level === 'critical').length,
    lowProducts: products.filter((product) => getStockStatus(product).level === 'low').length,
    mostConsumedShort: mostConsumed.length > 8 ? `${mostConsumed.slice(0, 8)}...` : mostConsumed,
    outOfStock: products.filter((product) => product.quantity === 0).length,
    periodEntries: entries.reduce((total, movement) => total + movement.quantity, 0),
    periodOutputs: outputs.reduce((total, movement) => total + movement.quantity, 0),
    totalProducts: products.length,
    totalStock: products.reduce((total, product) => total + product.quantity, 0),
  };
}

function getProductForecast(product: Product, movements: StockMovement[]) {
  const outputs = movements.filter((movement) => movement.productId === product.id && movement.type === 'out');
  const totalOutput = outputs.reduce((total, movement) => total + movement.quantity, 0);
  const dailyAverage = totalOutput / Math.max(outputs.length, 1);
  const daysLeft = dailyAverage > 0 ? Math.floor(product.quantity / dailyAverage) : null;

  return {
    dailyAverage,
    daysLeftText: daysLeft === null ? 'sem previsao' : `${daysLeft} dia(s)`,
  };
}

function getStockStatus(product: Product) {
  if (product.quantity <= 0 || product.quantity <= Math.max(Math.floor(product.lowStockLimit / 2), 1)) {
    return { color: theme.critical, label: 'Critico', level: 'critical' as const, softColor: theme.criticalSoft };
  }
  if (product.quantity <= product.lowStockLimit) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function SettingsSection({ onNavigate }: { onNavigate: (section: AppSection) => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderBlock}>
        <Text style={styles.sectionTitle}>Configuracoes</Text>
        <Text style={styles.sectionSubtitle}>
          Gerencie as preferencias da plataforma e informacoes legais.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.cardTitle}>Sistema</Text>
        <Text style={styles.cardSubtitle}>Informacoes tecnicas sobre o aplicativo.</Text>

        <View style={{ gap: 12, marginTop: 16 }}>
          <SettingsItem
            icon="smartphone-outline"
            label="Versão do aplicativo"
            value="v1.0.2 (Build 20260428)"
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.cardTitle}>Juridico e Suporte</Text>
        <Text style={styles.cardSubtitle}>Documentacao legal e diretrizes de uso.</Text>

        <View style={{ gap: 12, marginTop: 16 }}>
          <SettingsLink
            icon="file-text-outline"
            label="Termos de uso"
            description="Direitos e deveres na utilizacao do Estokar."
            onPress={() => onNavigate('terms')}
          />

          <SettingsLink
            icon="shield-checkmark-outline"
            label="Privacidade e Dados"
            description="Como protegemos sua seguranca e informacoes."
            onPress={() => onNavigate('privacy')}
          />

          <SettingsLink
            icon="information-circle-outline"
            label="Sobre o Estokar"
            description="Conheca a historia e os criadores por tras da ferramenta."
            onPress={() => onNavigate('about')}
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

      <View style={styles.panel}>
        <Text style={styles.legalTitle}>Termos de Uso</Text>
        <Text style={styles.legalSubtitle}>ESTOKAR INVENTORY OS</Text>

        <View style={styles.legalContent}>
          <LegalBlock title="1. Aceitacao dos Termos">
            Ao acessar e utilizar o Estokar Inventory OS, voce concorda em cumprir e estar vinculado aos seguintes termos e condicoes de uso. Este sistema e destinado exclusivamente para gestao de inventario empresarial.
          </LegalBlock>

          <LegalBlock title="2. Responsabilidade do Usuario">
            O usuario e responsavel pela veracidade das informacoes inseridas no sistema. O uso indevido para fins nao relacionados a gestao de estoque e proibido.
          </LegalBlock>

          <LegalBlock title="3. Controle de Acesso">
            As credenciais de acesso sao pessoais. O usuario compromete-se a notificar a administracao em caso de suspeita de uso nao autorizado.
          </LegalBlock>
        </View>
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

      <View style={styles.panel}>
        <Text style={styles.legalTitle}>Privacidade e Dados</Text>
        <Text style={styles.legalSubtitle}>ESTOKAR INVENTORY OS</Text>

        <View style={styles.legalContent}>
          <LegalBlock title="1. Coleta de Dados">
            Coletamos dados de usuario (nome, email), dados de inventario (produtos, quantidades) e historico de movimentacoes para fins de gestao e auditoria.
          </LegalBlock>

          <LegalBlock title="2. Uso e Protecao">
            Os dados sao usados apenas para relatorios e alertas. Utilizamos criptografia SSL/TLS e as senhas sao protegidas por algoritmos de hash.
          </LegalBlock>

          <LegalBlock title="3. Compartilhamento">
            Nao vendemos ou compartilhamos dados com terceiros para fins comerciais. O acesso e restrito a organizacao contratante.
          </LegalBlock>
        </View>
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

      <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}>
        <AppLogo size={80} />
        <Text style={[styles.legalTitle, { marginTop: 16 }]}>Estokar Inventory OS</Text>
        <Text style={[styles.legalSubtitle, { color: theme.accent }]}>VERSÃO 1.0.2</Text>

        <Text style={[styles.sectionSubtitle, { textAlign: 'center', marginTop: 16, paddingHorizontal: 20 }]}>
          Uma plataforma moderna e intuitiva desenhada para simplificar o controle de estoque com foco em agilidade e precisao.
        </Text>

        <View style={{ width: '100%', gap: 16, marginTop: 32 }}>
          <AboutItem icon="flash-outline" title="Agilidade Real-time" />
          <AboutItem icon="people-outline" title="Gestao Colaborativa" />
          <AboutItem icon="phone-portrait-outline" title="Multi-Plataforma" />
        </View>
      </View>
    </View>
  );
}

function SettingsItem({ icon, label, value }: { icon: AppIconName; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, backgroundColor: theme.soft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name={icon} size={20} color={theme.ink} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink }}>{label}</Text>
          <Text style={{ fontSize: 12, color: theme.muted }}>Sistema</Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '900', color: theme.accent }}>{value}</Text>
    </View>
  );
}

function SettingsLink({ icon, label, description, onPress }: { icon: AppIconName; label: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, backgroundColor: theme.soft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name={icon} size={20} color={theme.ink} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink }}>{label}</Text>
          <Text style={{ fontSize: 12, color: theme.muted }}>{description}</Text>
        </View>
      </View>
      <AppIcon name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
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

function AboutItem({ icon, title }: { icon: AppIconName; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <AppIcon name={icon} size={20} color={theme.accent} />
      <Text style={{ fontSize: 15, fontWeight: '800', color: theme.ink }}>{title}</Text>
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
  chartTrack: { backgroundColor: theme.soft, borderRadius: 99, flex: 1, height: 8, overflow: 'hidden' },
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
  editorForm: { gap: 16, paddingBottom: 16 },
  editorLayer: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 8 },
  editorSheet: { backgroundColor: '#ffffff', borderRadius: 28, maxHeight: '96%', padding: 24, width: '94%', maxWidth: 590 },
  editorSubtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
  emptyText: { color: theme.muted, fontSize: 14, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
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
  heroKicker: { color: theme.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  heroPanel: { ...elevatedShadow, borderRadius: 28, overflow: 'hidden', padding: 24 },
  heroSubtitle: { color: '#94a3b8', fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 280 },
  heroSubtitleHighlight: { color: '#ffffff', fontWeight: '800' },
  heroTitle: { color: '#ffffff', fontSize: 32, fontWeight: '800', lineHeight: 38, marginTop: 12, letterSpacing: -1 },
  heroTitleMuted: { fontSize: 18, color: '#94a3b8', fontWeight: '500' },
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
  legalText: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  legalContent: { gap: 24, marginTop: 32 },
  legalSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  legalTitle: { color: theme.ink, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
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
  metricValue: { color: theme.ink, fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  metricsGrid: { flexDirection: 'row', gap: 12 },
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
  movementInfo: { flex: 1 },
  movementList: { gap: 12, marginTop: 20 },
  movementOut: { backgroundColor: theme.criticalSoft },
  movementProduct: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  movementRow: { ...shadow, alignItems: 'center', backgroundColor: theme.card, borderRadius: 24, flexDirection: 'row', gap: 16, minHeight: 80, padding: 20, borderWidth: 1, borderColor: theme.stroke },
  noPhotoBox: { alignItems: 'center', backgroundColor: theme.soft, borderRadius: 20, justifyContent: 'center' },
  panel: { ...shadow, backgroundColor: theme.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.stroke },
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
  profileAvatarText: { color: '#FFFFFF', fontSize: 34, fontWeight: '700' },
  profileAvatarLarge: { alignItems: 'center', backgroundColor: theme.ink, borderRadius: 52, height: 104, justifyContent: 'center', marginBottom: 16, width: 104 },
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
});
