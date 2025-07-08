import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

const SettingsScreen = () => {
  const { profile } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Logout Error", error.message);
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, onPress, showArrow = true, color = "#333" }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.settingText, { color }]}>{title}</Text>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#999" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{profile?.fullName || 'User'}</Text>
        <Text style={styles.userRole}>{profile?.role || 'Role'}</Text>
        <Text style={styles.userPhone}>{profile?.phone || 'Phone not set'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          onPress={() => Alert.alert("Coming Soon", "Profile editing will be available soon")}
        />
        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          onPress={() => Alert.alert("Coming Soon", "Notification settings will be available soon")}
        />
        <SettingItem
          icon="language-outline"
          title="Language"
          onPress={() => Alert.alert("Language", "Currently available in English. Swahili coming soon!")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => Alert.alert("Help", "Contact us at support@zabibufresh.com")}
        />
        <SettingItem
          icon="information-circle-outline"
          title="About"
          onPress={() => Alert.alert("About", "Zabibu Fresh v1.0\nConnecting grape sellers and buyers in Dodoma region")}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          onPress={() => Alert.alert("Privacy", "Your privacy is important to us. Full policy available on our website.")}
        />
      </View>

      <View style={styles.section}>
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
          showArrow={false}
          color="#dc3545"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Zabibu Fresh</Text>
        <Text style={styles.footerSubtext}>Connecting Dodoma's Grape Community</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#6200ee',
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;