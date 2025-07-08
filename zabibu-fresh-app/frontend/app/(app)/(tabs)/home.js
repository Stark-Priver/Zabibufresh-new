import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { router } from 'expo-router';

const HomeScreen = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalMessages: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);

  const fetchDashboardStats = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      if (profile.role === 'seller') {
        // Fetch seller stats
        const { data: products, error: productsError } = await supabase
          .from('Product')
          .select('id')
          .eq('sellerId', profile.id);
        
        if (productsError) throw productsError;

        const { data: messages, error: messagesError } = await supabase
          .from('Message')
          .select('id')
          .eq('receiverId', profile.id);
        
        if (messagesError) throw messagesError;

        setStats({
          totalProducts: products?.length || 0,
          totalMessages: messages?.length || 0,
          recentActivity: []
        });
      } else {
        // Fetch buyer stats
        const { data: messages, error: messagesError } = await supabase
          .from('Message')
          .select('id')
          .eq('senderId', profile.id);
        
        if (messagesError) throw messagesError;

        setStats({
          totalProducts: 0,
          totalMessages: messages?.length || 0,
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickActionCard = ({ icon, title, subtitle, onPress, color = "#6200ee" }) => (
    <TouchableOpacity style={[styles.actionCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.actionCardContent}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.actionCardText}>
          <Text style={styles.actionCardTitle}>{title}</Text>
          <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color = "#6200ee" }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={30} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{profile.fullName || user?.email}!</Text>
          <View style={styles.roleContainer}>
            <Ionicons 
              name={profile.role === 'seller' ? 'leaf' : 'storefront'} 
              size={16} 
              color="#6200ee" 
            />
            <Text style={styles.roleText}>{profile.role}</Text>
          </View>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.fullName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      </View>

      {/* Stats Section */}
      {!loading && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsRow}>
            {profile.role === 'seller' && (
              <StatCard
                icon="cube-outline"
                value={stats.totalProducts}
                label="Products Listed"
                color="#27ae60"
              />
            )}
            <StatCard
              icon="chatbubble-outline"
              value={stats.totalMessages}
              label={profile.role === 'seller' ? 'Messages Received' : 'Messages Sent'}
              color="#3498db"
            />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {profile.role === 'seller' ? (
          <>
            <QuickActionCard
              icon="add-circle-outline"
              title="Add New Product"
              subtitle="List fresh grapes for sale"
              onPress={() => router.push('/(app)/add-product')}
              color="#27ae60"
            />
            <QuickActionCard
              icon="list-outline"
              title="My Products"
              subtitle="Manage your listings"
              onPress={() => router.push('/(app)/(tabs)/products')}
              color="#6200ee"
            />
            <QuickActionCard
              icon="chatbubbles-outline"
              title="Messages"
              subtitle="Chat with buyers"
              onPress={() => router.push('/(app)/(tabs)/chat')}
              color="#3498db"
            />
          </>
        ) : (
          <>
            <QuickActionCard
              icon="search-outline"
              title="Browse Products"
              subtitle="Find fresh grapes near you"
              onPress={() => router.push('/(app)/(tabs)/products')}
              color="#27ae60"
            />
            <QuickActionCard
              icon="chatbubbles-outline"
              title="My Conversations"
              subtitle="Chat with sellers"
              onPress={() => router.push('/(app)/(tabs)/chat')}
              color="#3498db"
            />
            <QuickActionCard
              icon="location-outline"
              title="Nearby Sellers"
              subtitle="Find sellers in Dodoma"
              onPress={() => router.push('/(app)/(tabs)/products')}
              color="#e67e22"
            />
          </>
        )}
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>
          {profile.role === 'seller' ? 'Selling Tips' : 'Buying Tips'}
        </Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#f39c12" />
          <Text style={styles.tipText}>
            {profile.role === 'seller' 
              ? "Add clear photos and detailed descriptions to attract more buyers!"
              : "Contact sellers directly to negotiate prices and arrange pickup times."
            }
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Zabibu Fresh - Connecting Dodoma's Grape Community</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    color: '#6200ee',
    marginLeft: 5,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  actionCardText: {
    flex: 1,
    marginLeft: 15,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;