import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
type StockFilter = 'all' | 'low' | 'critical';

const NO_PHOTO_IMAGE = 'sem-foto';

WebBrowser.maybeCompleteAuthSession();

const theme = {
  accent: '#246BFE',
  accentSoft: '#EAF1FF',
  bg: '#F6F7FB',
  card: '#FFFFFF',
  critical: '#E5484D',
  criticalSoft: '#FDEBEC',
  ink: '#080B12',
  low: '#D99A00',
  lowSoft: '#FFF6D8',
  muted: '#697386',
  ok: '#159A61',
  okSoft: '#E7F7EF',
  soft: '#EEF1F6',
  stroke: '#DDE3EE',
};

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
      const redirectUri = Linking.createURL('auth/callback');
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

      if (!accessToken || !refreshToken) {
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
          role: profile.role,
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
          <View style={styles.authHero}>
            <View style={styles.authGlow} />
            <AppLogo size={84} />
            <Text style={styles.brandName}>Estokar</Text>
            <Text style={styles.brandSubtitle}>
              Estoque inteligente com previsao, alertas e historico de movimentacao.
            </Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.segmentedControl}>
              <SegmentButton active={!isRegister} label="Entrar" onPress={() => setMode('login')} />
              <SegmentButton active={isRegister} label="Criar conta" onPress={() => setMode('register')} />
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
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordField}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Senha"
                  placeholderTextColor="#929AAA"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPassword((current) => !current)}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={21}
                    color={theme.ink}
                  />
                </Pressable>
              </View>
            </View>

            {isRegister ? <PremiumInput label="Confirmar senha" placeholder="Repita a senha" secureTextEntry /> : null}
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
              <Text style={styles.primaryButtonText}>
                {authLoading ? 'Conectando...' : isRegister ? 'Criar conta' : 'Entrar'}
              </Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={googleLoading}
              onPress={handleGoogleLogin}
              style={({ pressed }) => [
                styles.googleButton,
                googleLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="logo-google" size={19} color={theme.ink} />
              <Text style={styles.googleButtonText}>
                {googleLoading ? 'Conectando Google...' : 'Continuar com Google'}
              </Text>
            </Pressable>
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
        // Se não tem remoteId, remove apenas localmente (já remove do outbox se houver)
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
      if (product.remoteId) {
        const nextQuantity = type === 'in' ? product.quantity + quantity : product.quantity - quantity;
        if (nextQuantity < 0) throw new Error('Estoque insuficiente.');

        await updateRemoteProduct(session.accessToken, product.remoteId, {
          ...product,
          quantity: nextQuantity,
        } as UpdateProductInput);
      } else {
        throw new Error('Produto ainda não sincronizado.');
      }
    } catch {
      await moveLocalStock(product, type, quantity);
    } finally {
      await refreshProducts();
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
            <Ionicons name="menu" size={25} color={theme.ink} />
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
            <HistorySection insights={insights} movements={movements} />
          ) : null}
          {section === 'profile' ? (
            <ProfileSection
              insights={insights}
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
            <View style={styles.sidebar}>
              <View style={styles.sidebarBrand}>
                <AppLogo size={48} />
                <View>
                  <Text style={styles.sidebarTitle}>Estokar</Text>
                  <Text style={styles.sidebarSubtitle}>Inventory OS</Text>
                </View>
              </View>
              <SidebarItem active={section === 'home'} icon="grid-outline" label="Inicio" onPress={() => navigate('home')} />
              <SidebarItem active={section === 'products'} icon="cube-outline" label="Produtos" onPress={() => navigate('products')} />
              <SidebarItem active={section === 'history'} icon="receipt-outline" label="Historico" onPress={() => navigate('history')} />
              <SidebarItem active={section === 'profile'} icon="person-outline" label="Perfil" onPress={() => navigate('profile')} />
              <SidebarItem active={section === 'settings'} icon="settings-outline" label="Configuracoes" onPress={() => navigate('settings')} />
            </View>
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
      <View style={styles.heroPanel}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroKicker}>Dashboard inteligente</Text>
        <Text style={styles.heroTitle}>{insights.totalStock} itens em estoque</Text>
        <Text style={styles.heroSubtitle}>
          {insights.criticalProducts} produto(s) em falta ou criticos. Reposicao sugerida em destaque.
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="cube-outline" label="Produtos" value={String(products.length)} />
        <MetricCard icon="alert-circle-outline" label="Baixo" value={String(insights.lowProducts)} />
        <MetricCard icon="close-circle-outline" label="Em falta" value={String(insights.outOfStock)} />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="log-in-outline" label="Entradas" value={`+${insights.periodEntries}`} />
        <MetricCard icon="log-out-outline" label="Saidas" value={`-${insights.periodOutputs}`} />
        <MetricCard icon="flame-outline" label="Mais usado" value={insights.mostConsumedShort} />
      </View>

      <View style={styles.panel}>
        <SectionHeading caption="3 maiores e 3 menores estoques" title="Visao operacional" />
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
        <SectionHeading caption="Alertas automaticos" title="Reposicao sugerida" />
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
          <Text style={styles.emptyText}>Nenhum alerta critico agora.</Text>
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
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [form, setForm] = useState({
    category: '',
    categoryId: '',
    description: '',
    image: '',
    lowStockLimit: '5',
    name: '',
    quantity: '',
  });
  const [movementQuantity, setMovementQuantity] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const status = getStockStatus(product);
      const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && status.level === 'low') ||
        (stockFilter === 'critical' && status.level === 'critical');

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [categoryFilter, products, query, stockFilter]);

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
    setMovementQuantity('');
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
    setMovementQuantity('');
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

  async function handleMovement(type: StockMovement['type']) {
    const parsed = Number(movementQuantity);
    if (!editingProduct || !Number.isFinite(parsed) || parsed <= 0) return;

    try {
      await onMoveStock(editingProduct, type, Math.trunc(parsed));
      setMovementQuantity('');
      setModalVisible(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao movimentar estoque.';
      Alert.alert('Atenção', message);
    }
  }

  async function handleQuickDecrease() {
    if (!editingProduct) return;

    try {
      await onMoveStock(editingProduct, 'out', 1);
      setMovementQuantity('');
      setModalVisible(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar consumo rápido.';
      Alert.alert('Atenção', message);
    }
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
        <SectionHeading caption="Busca, filtros e categorias" title="Produtos" />
        <Pressable
          accessibilityRole="button"
          onPress={openCreateModal}
          style={({ pressed }) => [styles.addProductButton, pressed && styles.buttonPressed]}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addProductButtonText}>Novo</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Buscar produto"
          placeholderTextColor="#929AAA"
          style={styles.searchInput}
          value={query}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Chip
          active={categoryFilter === 'Todos'}
          label="Todos"
          onPress={() => setCategoryFilter('Todos')}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            active={categoryFilter === category.name}
            label={category.name}
            onLongPress={() => handleCategoryLongPress(category)}
            onPress={() => setCategoryFilter(category.name)}
          />
        ))}
        <Chip active={false} label="+" onPress={openCreateCategoryModal} />
      </ScrollView>

      <View style={styles.filterRowWrap}>
        <Chip active={stockFilter === 'all'} label="Todos" onPress={() => setStockFilter('all')} />
        <Chip active={stockFilter === 'low'} label="Baixo" onPress={() => setStockFilter('low')} />
        <Chip active={stockFilter === 'critical'} label="Critico" onPress={() => setStockFilter('critical')} />
      </View>

      <View style={styles.productList}>
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} onPress={() => openEditModal(product)} />
        ))}
      </View>
      <ProductEditorModal
        categories={categories}
        editingProduct={editingProduct}
        form={form}
        imageModalVisible={imageModalVisible}
        movementQuantity={movementQuantity}
        onChangeForm={updateForm}
        onChangeMovementQuantity={setMovementQuantity}
        onClose={() => {
          resetForm();
          setModalVisible(false);
        }}
        onDelete={handleDeleteProduct}
        onMoveIn={() => handleMovement('in')}
        onMoveOut={() => handleMovement('out')}
        onOpenImageModal={() => setImageModalVisible(true)}
        onPickFromCamera={takeProductPhoto}
        onPickFromGallery={pickProductImage}
        onQuickDecrease={handleQuickDecrease}
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.categoryModalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.categoryModalTitle}>{mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}</Text>
            <TextInput
              autoFocus
              onChangeText={onChangeName}
              placeholder="Nome da categoria"
              placeholderTextColor="#929AAA"
              style={styles.categoryInput}
              value={value}
            />
            <View style={styles.modalButtonRow}>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{mode === 'edit' ? 'Salvar' : 'Criar'}</Text>
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
            <Ionicons name="create-outline" size={22} color={theme.ink} />
            <Text style={styles.imageModalActionText}>Editar</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.imageModalAction, pressed && styles.pressed]}>
            <Ionicons name="trash-outline" size={22} color={theme.critical} />
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
  movementQuantity,
  onChangeForm,
  onChangeMovementQuantity,
  onClose,
  onDelete,
  onMoveIn,
  onMoveOut,
  onOpenImageModal,
  onPickFromCamera,
  onPickFromGallery,
  onQuickDecrease,
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
  movementQuantity: string;
  onChangeForm: (key: keyof ProductEditorModalProps['form'], value: string) => void;
  onChangeMovementQuantity: (value: string) => void;
  onClose: () => void;
  onDelete: () => void;
  onMoveIn: () => void;
  onMoveOut: () => void;
  onOpenImageModal: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
  onQuickDecrease: () => void;
  onSave: () => void;
  setImageModalVisible: (visible: boolean) => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.editorLayer}>
        <Pressable onPress={onClose} style={styles.modalBackdrop} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                  <Ionicons name="close" size={22} color={theme.ink} />
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
                    <Ionicons name="chevron-forward" size={20} color={theme.muted} />
                  </Pressable>
                </View>

                {editingProduct ? (
                  <View style={styles.movementEditor}>
                    <SectionHeading caption="Registre entrada ou saida" title="Movimentacao" />
                    <PremiumInput
                      keyboardType="number-pad"
                      label="Quantidade"
                      onChangeText={onChangeMovementQuantity}
                      placeholder="0"
                      value={movementQuantity}
                    />
                    <View style={styles.modalButtonRow}>
                      <Pressable accessibilityRole="button" onPress={onMoveIn} style={styles.entryButton}>
                        <Text style={styles.entryButtonText}>+ Entrada</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={onMoveOut} style={styles.exitButton}>
                        <Text style={styles.exitButtonText}>- Saida</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onQuickDecrease}
                      style={styles.ghostButton}>
                      <Text style={styles.ghostButtonText}>Registrar consumo rapido (-1)</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.modalButtonRow}>
                  <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={onSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </Pressable>
                </View>

                {editingProduct ? (
                  <Pressable accessibilityRole="button" onPress={onDelete} style={styles.deleteProductButton}>
                    <Ionicons name="trash-outline" size={19} color={theme.ink} />
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

function ProductCard({ onPress, product }: { onPress: () => void; product: Product }) {
  const status = getStockStatus(product);
  const forecast = getProductForecast(product, []);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.productCard, pressed && styles.productCardPressed]}>
      <ProductImage image={product.image} size={72} />
      <View style={styles.productInfo}>
        <View style={styles.productTitleRow}>
          <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
          <View style={[styles.stockPill, { backgroundColor: status.softColor }]}>
            <Text style={[styles.stockPillText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.productDescription}>{product.description}</Text>
        <View style={styles.productMetaRow}>
          <Text style={styles.productCategory}>{product.category || 'Nao categorizado'}</Text>
          <Text style={styles.productQuantity}>{product.quantity} un.</Text>
          <Text style={styles.productForecast}>{forecast.daysLeftText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function HistorySection({
  insights,
  movements,
}: {
  insights: InventoryInsights;
  movements: StockMovement[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heroPanel}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroKicker}>Historico</Text>
        <Text style={styles.heroTitle}>
          +{insights.periodEntries} / -{insights.periodOutputs}
        </Text>
        <Text style={styles.heroSubtitle}>
          Extrato de entradas e saidas registradas no estoque.
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="log-in-outline" label="Entradas" value={`+${insights.periodEntries}`} />
        <MetricCard icon="log-out-outline" label="Saidas" value={`-${insights.periodOutputs}`} />
        <MetricCard icon="receipt-outline" label="Registros" value={String(movements.length)} />
      </View>

      <MovementPanel movements={movements} />
    </View>
  );
}

function MovementPanel({ compact, movements }: { compact?: boolean; movements: StockMovement[] }) {
  const visibleMovements = compact ? movements.slice(0, 5) : movements.slice(0, 8);

  return (
    <View style={styles.panel}>
      <SectionHeading caption="Entradas e saidas recentes" title="Historico" />
      <View style={styles.movementList}>
        {visibleMovements.length ? (
          visibleMovements.map((movement) => (
            <View key={movement.id} style={styles.movementRow}>
              <View style={[styles.movementIcon, movement.type === 'in' ? styles.movementIn : styles.movementOut]}>
                <Ionicons
                  name={movement.type === 'in' ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={movement.type === 'in' ? theme.ok : theme.critical}
                />
              </View>
              <View style={styles.movementInfo}>
                <Text numberOfLines={1} style={styles.movementProduct}>{movement.productName}</Text>
                <Text style={styles.movementDate}>{formatDate(movement.createdAt)}</Text>
              </View>
              <Text style={[styles.movementAmount, movement.type === 'in' ? styles.movementAmountIn : styles.movementAmountOut]}>
                {movement.type === 'in' ? '+' : '-'}{movement.quantity}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma movimentacao registrada.</Text>
        )}
      </View>
    </View>
  );
}

function ProfileSection({
  insights,
  onDeleteAccount,
  onLogout,
  user,
}: {
  insights: InventoryInsights;
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
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{getInitial(user.name)}</Text>
        </View>
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>

      <View style={styles.profileInfo}>
        <InfoRow label="Cargo" value={user.role ?? 'Usuario'} />
        <InfoRow label="Produtos" value={String(insights.totalProducts)} />
        <InfoRow label="Itens no estoque" value={String(insights.totalStock)} />
        <InfoRow label="Produtos criticos" value={String(insights.criticalProducts)} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={deletingAccount}
        onPress={handleDeleteAccountPress}
        style={({ pressed }) => [
          styles.deleteAccountButton,
          deletingAccount && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}>
        <Ionicons name="trash-outline" size={19} color={theme.critical} />
        <Text style={styles.deleteAccountButtonText}>
          {deletingAccount ? 'Excluindo conta...' : 'Excluir conta'}
        </Text>
      </Pressable>
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
}: {
  active: boolean;
  label: string;
  onLongPress?: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      delayLongPress={240}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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
        placeholderTextColor="#929AAA"
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
      <Ionicons name="add" size={Math.round(size * 0.42)} color={theme.accent} />
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

function ImageModalAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.imageModalAction, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={theme.ink} />
      <Text style={styles.imageModalActionText}>{label}</Text>
    </Pressable>
  );
}

function AppLogo({ size }: { size: number }) {
  const markSize = Math.round(size * 0.34);
  return (
    <View style={[styles.logo, { borderRadius: Math.round(size * 0.3), height: size, width: size }]}>
      <Text style={[styles.logoLetter, { fontSize: Math.round(size * 0.5) }]}>E</Text>
      <View style={[styles.logoMark, { borderRadius: Math.round(markSize * 0.46), height: markSize, width: markSize }]}>
        <Ionicons name="cube-outline" size={Math.round(size * 0.18)} color={theme.ink} />
      </View>
    </View>
  );
}

function SidebarItem({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.sidebarItem, active && styles.sidebarItemActive, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={active ? '#FFFFFF' : theme.ink} />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

function OperationalRow({ color, maxQuantity, product }: { color: string; maxQuantity: number; product: Product }) {
  return (
    <View style={styles.chartRow}>
      <Text numberOfLines={1} style={styles.chartLabel}>{product.name}</Text>
      <View style={styles.chartTrack}>
        <View
          style={[
            styles.chartBar,
            { backgroundColor: color, width: `${Math.max((product.quantity / maxQuantity) * 100, 8)}%` },
          ]}
        />
      </View>
      <Text style={styles.chartValue}>{product.quantity}</Text>
    </View>
  );
}

function MetricCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={18} color={theme.accent} />
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
      <View style={styles.panel}>
        <Text style={[styles.sectionTitle, { fontSize: 20, marginBottom: 20 }]}>Configuracoes</Text>
        
        <View style={{ gap: 4 }}>
          <SettingsItem 
            icon="smartphone-outline" 
            label="Versao do aplicativo" 
            value="v1.2.4 (Build 20240422)" 
          />
          
          <View style={{ height: 1, backgroundColor: theme.stroke, marginVertical: 12 }} />
          
          <SettingsLink 
            icon="file-text-outline" 
            label="Termos de uso" 
            description="Leia as regras de utilizacao do sistema." 
            onPress={() => onNavigate('terms')}
          />
          
          <SettingsLink 
            icon="shield-checkmark-outline" 
            label="Privacidade e Dados" 
            description="Como seus dados sao tratados." 
            onPress={() => onNavigate('privacy')}
          />
          
          <SettingsLink 
            icon="information-circle-outline" 
            label="Sobre o Estokar" 
            description="Informacoes sobre a plataforma." 
            onPress={() => onNavigate('about')}
          />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={[styles.chartGroupLabel, { marginBottom: 12 }]}>INFORMACOES LEGAIS</Text>
        <Text style={[styles.sectionSubtitle, { fontSize: 13 }]}>
          O Estokar Inventory OS e uma ferramenta de gestao interna. Ao utilizar este software, voce concorda que os dados inseridos sao de responsabilidade da organizacao contratante.
        </Text>
        <Text style={[styles.sectionSubtitle, { fontSize: 11, marginTop: 12, opacity: 0.6 }]}>
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
        <Ionicons name="chevron-back" size={20} color={theme.ink} />
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
        <Ionicons name="chevron-back" size={20} color={theme.ink} />
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
        <Ionicons name="chevron-back" size={20} color={theme.ink} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>
      
      <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}>
        <AppLogo size={80} />
        <Text style={[styles.legalTitle, { marginTop: 16 }]}>Estokar Inventory OS</Text>
        <Text style={[styles.legalSubtitle, { color: theme.accent }]}>VERSAO 1.2.4</Text>
        
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

function SettingsItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, backgroundColor: theme.soft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={20} color={theme.ink} />
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

function SettingsLink({ icon, label, description, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, backgroundColor: theme.soft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={20} color={theme.ink} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.ink }}>{label}</Text>
          <Text style={{ fontSize: 12, color: theme.muted }}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
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

function AboutItem({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name={icon} size={20} color={theme.accent} />
      <Text style={{ fontSize: 15, fontWeight: '800', color: theme.ink }}>{title}</Text>
    </View>
  );
}

const shadow = {
  elevation: 8,
  shadowColor: '#0B1220',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
};

const styles = StyleSheet.create({
  addProductButton: { ...shadow, alignItems: 'center', backgroundColor: theme.accent, borderRadius: 16, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  addProductButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  backButton: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 12 },
  backButtonText: { color: theme.ink, fontSize: 14, fontWeight: '800' },
  alertCard: { alignItems: 'center', backgroundColor: theme.bg, borderRadius: 16, flexDirection: 'row', gap: 12, minHeight: 66, padding: 12 },
  alertInfo: { flex: 1 },
  alertList: { gap: 10, marginTop: 16 },
  alertText: { color: theme.muted, fontSize: 13, marginTop: 3 },
  alertTitle: { color: theme.ink, fontSize: 15, fontWeight: '900' },
  appHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 70, paddingHorizontal: 18 },
  appSafeArea: { backgroundColor: theme.bg, flex: 1 },
  appShell: { flex: 1 },
  authCard: { ...shadow, backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 28, borderWidth: 1, gap: 16, padding: 18 },
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  authGlow: { backgroundColor: theme.accentSoft, borderRadius: 90, height: 180, opacity: 0.9, position: 'absolute', top: -38, width: 180 },
  authHero: { alignItems: 'center', marginBottom: 26, position: 'relative' },
  authMessage: { color: theme.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  authSafeArea: { backgroundColor: theme.bg, flex: 1 },
  avatarButton: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  brandName: { color: theme.ink, fontSize: 40, fontWeight: '900', lineHeight: 46 },
  brandSubtitle: { color: theme.muted, fontSize: 16, lineHeight: 23, marginTop: 8, maxWidth: 310, textAlign: 'center' },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  cancelButton: { alignItems: 'center', backgroundColor: theme.soft, borderRadius: 18, flex: 1, justifyContent: 'center', minHeight: 54 },
  cancelButtonText: { color: theme.ink, fontSize: 16, fontWeight: '900' },
  chart: { gap: 14, marginTop: 18 },
  chartBar: { backgroundColor: theme.accent, borderRadius: 99, height: 10 },
  chartGroupLabel: { color: theme.ok, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  chartLabel: { color: theme.ink, fontSize: 12, fontWeight: '700', width: 90 },
  chartRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  chartTrack: { backgroundColor: theme.soft, borderRadius: 99, flex: 1, height: 10, overflow: 'hidden' },
  chartValue: { color: theme.ink, fontSize: 12, fontWeight: '900', textAlign: 'right', width: 28 },
  categoryInput: { backgroundColor: '#FBFCFE', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, color: theme.ink, flex: 1, fontSize: 15, minHeight: 44, paddingHorizontal: 14 },
  categoryModalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 14, paddingBottom: 28, paddingHorizontal: 18, paddingTop: 10 },
  categoryModalTitle: { color: theme.ink, fontSize: 20, fontWeight: '900' },
  categorySaveButton: { alignItems: 'center', backgroundColor: theme.accent, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  chip: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 38, paddingHorizontal: 14 },
  chipActive: { backgroundColor: theme.ink, borderColor: theme.ink },
  chipText: { color: theme.ink, fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  content: { paddingBottom: 34, paddingHorizontal: 18, paddingTop: 8 },
  createProductTitle: { color: theme.ink, fontSize: 21, fontWeight: '900' },
  criticalText: { color: theme.critical },
  deleteProductButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 52 },
  deleteAccountButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#F4C7CA', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 },
  deleteAccountButtonText: { color: theme.critical, fontSize: 15, fontWeight: '900' },
  deleteProductButtonText: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  descriptionInput: { minHeight: 92, paddingTop: 14, textAlignVertical: 'top' },
  editorForm: { gap: 14, paddingBottom: 18 },
  editorLayer: { flex: 1, justifyContent: 'flex-end' },
  editorSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '92%', paddingHorizontal: 18, paddingTop: 10 },
  editorSubtitle: { color: theme.muted, fontSize: 13, marginTop: 3 },
  emptyText: { color: theme.muted, fontSize: 14, marginTop: 14 },
  entryButton: { alignItems: 'center', backgroundColor: theme.okSoft, borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 48 },
  entryButtonText: { color: theme.ok, fontSize: 15, fontWeight: '900' },
  exitButton: { alignItems: 'center', backgroundColor: theme.criticalSoft, borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 48 },
  exitButtonText: { color: theme.critical, fontSize: 15, fontWeight: '900' },
  field: { gap: 8 },
  filterRow: { gap: 8, paddingRight: 18 },
  filterRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formCloseButton: { alignItems: 'center', backgroundColor: theme.soft, borderRadius: 14, height: 38, justifyContent: 'center', width: 38 },
  formHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  ghostButton: { alignItems: 'center', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 46 },
  ghostButtonText: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  googleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 },
  googleButtonText: { color: theme.ink, fontSize: 15, fontWeight: '800' },
  headerEyebrow: { color: theme.muted, fontSize: 12, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  headerIconButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  headerTitle: { color: theme.ink, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  heroAccent: { backgroundColor: theme.accent, borderRadius: 90, height: 130, opacity: 0.9, position: 'absolute', right: -38, top: -42, width: 130 },
  heroKicker: { color: '#AEB7C8', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  heroPanel: { ...shadow, backgroundColor: theme.ink, borderRadius: 28, overflow: 'hidden', padding: 22 },
  heroSubtitle: { color: '#C9D1DF', fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 270 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', lineHeight: 36, marginTop: 10 },
  iconButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  imageModal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 10, paddingBottom: 28, paddingHorizontal: 18, paddingTop: 10 },
  imageModalAction: { alignItems: 'center', backgroundColor: theme.bg, borderRadius: 18, flexDirection: 'row', gap: 12, minHeight: 58, paddingHorizontal: 16 },
  imageModalActionText: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  imageModalTitle: { color: theme.ink, fontSize: 20, fontWeight: '900', marginBottom: 4 },
  imagePickerButton: { alignItems: 'center', backgroundColor: '#FBFCFE', borderColor: theme.stroke, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 14, minHeight: 100, padding: 12 },
  imagePickerSubtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
  imagePickerTextBlock: { flex: 1 },
  imagePickerTitle: { color: theme.ink, fontSize: 16, fontWeight: '900' },
  infoLabel: { color: theme.muted, fontSize: 15 },
  infoRow: { alignItems: 'center', borderBottomColor: theme.stroke, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58 },
  infoValue: { color: theme.ink, fontSize: 15, fontWeight: '900' },
  inlineField: { flex: 1 },
  inlineInputs: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#FBFCFE', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, color: theme.ink, fontSize: 16, minHeight: 54, paddingHorizontal: 16 },
  inputFocused: { borderColor: theme.accent, shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.16, shadowRadius: 12 },
  keyboardView: { flex: 1 },
  label: { color: theme.ink, fontSize: 13, fontWeight: '800', paddingLeft: 2 },
  legalContent: { gap: 20, marginTop: 24 },
  legalSubtitle: { color: theme.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  legalTitle: { color: theme.ink, fontSize: 24, fontWeight: '900' },
  loadingScreen: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { color: theme.ink, fontSize: 18, fontWeight: '800', marginTop: 10 },
  logo: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, justifyContent: 'center', marginBottom: 18, position: 'relative' },
  logoLetter: { color: '#FFFFFF', fontWeight: '900', lineHeight: 44 },
  logoMark: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderWidth: 1, bottom: -5, justifyContent: 'center', position: 'absolute', right: -5 },
  logoutButton: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 56 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  metricCard: { ...shadow, backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 20, borderWidth: 1, flex: 1, minHeight: 110, padding: 13 },
  metricIcon: { alignItems: 'center', backgroundColor: theme.accentSoft, borderRadius: 12, height: 34, justifyContent: 'center', marginBottom: 10, width: 34 },
  metricLabel: { color: theme.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  metricValue: { color: theme.ink, fontSize: 23, fontWeight: '900' },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 11, 18, 0.32)' },
  modalButtonRow: { flexDirection: 'row', gap: 10 },
  modalCancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  modalCancelText: { color: theme.muted, fontSize: 16, fontWeight: '800' },
  modalHandle: { alignSelf: 'center', backgroundColor: theme.stroke, borderRadius: 2, height: 4, marginBottom: 8, width: 44 },
  modalLayer: { flex: 1, justifyContent: 'flex-end' },
  movementAmount: { fontSize: 16, fontWeight: '900' },
  movementAmountIn: { color: theme.ok },
  movementAmountOut: { color: theme.critical },
  movementDate: { color: theme.muted, fontSize: 12, marginTop: 2 },
  movementEditor: { backgroundColor: theme.bg, borderRadius: 20, gap: 12, padding: 14 },
  movementIcon: { alignItems: 'center', borderRadius: 13, height: 34, justifyContent: 'center', width: 34 },
  movementIn: { backgroundColor: theme.okSoft },
  movementInfo: { flex: 1 },
  movementList: { gap: 10, marginTop: 16 },
  movementOut: { backgroundColor: theme.criticalSoft },
  movementProduct: { color: theme.ink, fontSize: 14, fontWeight: '900' },
  movementRow: { alignItems: 'center', backgroundColor: theme.bg, borderRadius: 16, flexDirection: 'row', gap: 12, minHeight: 58, paddingHorizontal: 12 },
  noPhotoBox: { alignItems: 'center', backgroundColor: theme.accentSoft, borderColor: '#D7E4FF', borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  panel: { ...shadow, backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 24, borderWidth: 1, padding: 18 },
  passwordField: { alignItems: 'center', backgroundColor: '#FBFCFE', borderColor: theme.stroke, borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingLeft: 16, paddingRight: 8 },
  passwordInput: { color: theme.ink, flex: 1, fontSize: 16, minHeight: 52 },
  pressed: { opacity: 0.72 },
  primaryButton: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 56 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  productCard: { ...shadow, alignItems: 'center', backgroundColor: theme.card, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 14, minHeight: 104, padding: 13 },
  productCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  productCategory: { color: theme.muted, fontSize: 12, fontWeight: '800' },
  productDescription: { color: theme.muted, fontSize: 13 },
  productForecast: { color: theme.muted, fontSize: 12, fontWeight: '800' },
  productImage: { backgroundColor: theme.soft, borderRadius: 16 },
  productInfo: { flex: 1, gap: 5 },
  productList: { gap: 12 },
  productMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  productName: { color: theme.ink, flex: 1, fontSize: 16, fontWeight: '900' },
  productQuantity: { color: theme.accent, fontSize: 13, fontWeight: '900' },
  productTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  productsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  profileAvatar: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, borderRadius: 42, height: 84, justifyContent: 'center', marginBottom: 14, width: 84 },
  profileAvatarText: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  profileEmail: { color: theme.muted, fontSize: 15, marginTop: 5 },
  profileHero: { ...shadow, alignItems: 'center', backgroundColor: theme.card, borderRadius: 28, padding: 24 },
  profileInfo: { ...shadow, backgroundColor: theme.card, borderRadius: 22, paddingHorizontal: 16 },
  profileName: { color: theme.ink, fontSize: 24, fontWeight: '900' },
  saveButton: { ...shadow, alignItems: 'center', backgroundColor: theme.ink, borderRadius: 18, flex: 1, justifyContent: 'center', minHeight: 54 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  searchBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: theme.stroke, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 50, paddingHorizontal: 14 },
  searchInput: { color: theme.ink, flex: 1, fontSize: 15 },
  section: { gap: 18 },
  sectionHeader: { gap: 4 },
  sectionSubtitle: { color: theme.muted, fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: theme.ink, fontSize: 24, fontWeight: '900' },
  segmentButton: { alignItems: 'center', borderRadius: 13, flex: 1, justifyContent: 'center', minHeight: 42 },
  segmentButtonActive: { ...shadow, backgroundColor: '#FFFFFF', elevation: 3, shadowOpacity: 0.05, shadowRadius: 10 },
  segmentText: { color: theme.muted, fontSize: 14, fontWeight: '700' },
  segmentTextActive: { color: theme.ink },
  segmentedControl: { backgroundColor: theme.soft, borderRadius: 16, flexDirection: 'row', gap: 4, padding: 4 },
  sidebar: { ...shadow, backgroundColor: theme.card, borderBottomRightRadius: 28, borderTopRightRadius: 28, gap: 8, height: '100%', paddingHorizontal: 18, paddingTop: 24, width: 286 },
  sidebarBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 11, 18, 0.32)' },
  sidebarBrand: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 28 },
  sidebarItem: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 12, minHeight: 52, paddingHorizontal: 14 },
  sidebarItemActive: { backgroundColor: theme.ink },
  sidebarItemText: { color: theme.ink, fontSize: 16, fontWeight: '800' },
  sidebarItemTextActive: { color: '#FFFFFF' },
  sidebarLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  sidebarSubtitle: { color: theme.muted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  sidebarTitle: { color: theme.ink, fontSize: 23, fontWeight: '900' },
  statusDot: { borderRadius: 6, height: 12, width: 12 },
  stockPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  stockPillText: { fontSize: 11, fontWeight: '900' },
});
