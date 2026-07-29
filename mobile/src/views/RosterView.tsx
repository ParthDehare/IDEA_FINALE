import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Search, ChevronRight } from 'lucide-react-native';

export function RosterView({
  styles,
  COLORS,
  rosterSearch,
  setRosterSearch,
  rosterRole,
  setRosterRole,
  rosterTier,
  setRosterTier,
  filteredRoster,
  showProfileModal,
  TIER_COLORS
}: any) {
  return (
          <View style={styles.tabContainer}>
            {/* Filter controls */}
            <View style={styles.filterCard}>
              <View style={styles.searchRow}>
                <Search color={COLORS.text2} size={15} />
                <TextInput
                  style={styles.searchInput}
                  value={rosterSearch}
                  onChangeText={setRosterSearch}
                  placeholder="Search Employee ID..."
                  placeholderTextColor="#777"
                />
              </View>

              <View style={styles.filtersRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterTag, rosterRole === 'ALL' && styles.activeFilterTag]}
                    onPress={() => setRosterRole('ALL')}
                  >
                    <Text style={styles.filterTagText}>ALL ROLES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTag, rosterRole === 'CLERK' && styles.activeFilterTag]}
                    onPress={() => setRosterRole('CLERK')}
                  >
                    <Text style={styles.filterTagText}>CLERK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTag, rosterRole === 'MANAGER' && styles.activeFilterTag]}
                    onPress={() => setRosterRole('MANAGER')}
                  >
                    <Text style={styles.filterTagText}>MANAGER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTag, rosterRole === 'IT_ADMIN' && styles.activeFilterTag]}
                    onPress={() => setRosterRole('IT_ADMIN')}
                  >
                    <Text style={styles.filterTagText}>IT_ADMIN</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View style={[styles.filtersRow, { marginTop: 8 }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterTag, rosterTier === 'ALL' && styles.activeFilterTag]}
                    onPress={() => setRosterTier('ALL')}
                  >
                    <Text style={styles.filterTagText}>ALL TIERS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterTag,
                      rosterTier === 'CRITICAL' && styles.activeFilterTag,
                      { borderColor: COLORS.red },
                    ]}
                    onPress={() => setRosterTier('CRITICAL')}
                  >
                    <Text style={[styles.filterTagText, { color: COLORS.red }]}>CRITICAL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterTag,
                      rosterTier === 'HIGH' && styles.activeFilterTag,
                      { borderColor: COLORS.amber },
                    ]}
                    onPress={() => setRosterTier('HIGH')}
                  >
                    <Text style={[styles.filterTagText, { color: COLORS.amber }]}>HIGH</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterTag,
                      rosterTier === 'WATCH' && styles.activeFilterTag,
                      { borderColor: COLORS.cyan },
                    ]}
                    onPress={() => setRosterTier('WATCH')}
                  >
                    <Text style={[styles.filterTagText, { color: COLORS.cyan }]}>WATCH</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filteredRoster}
              keyExtractor={(item) => item.emp_id}
              contentContainerStyle={styles.rosterList}
              renderItem={({ item }) => {
                const c = TIER_COLORS[item.status];
                return (
                  <TouchableOpacity
                    style={styles.rosterRow}
                    onPress={() => showProfileModal(item.emp_id)}
                  >
                    <View style={styles.rosterLeft}>
                      <Text style={styles.rosterEmpId}>{item.emp_id}</Text>
                      <Text style={styles.rosterMeta}>
                        {item.emp_class} | {item.branch_id}
                      </Text>
                    </View>
                    <View style={styles.rosterRight}>
                      <View style={[styles.rosterBadge, { backgroundColor: c + '22', borderColor: c }]}>
                        <Text style={[styles.rosterBadgeText, { color: c }]}>{item.status}</Text>
                      </View>
                      <Text style={styles.rosterPeakText}>Peak CBSI: {item.peak}</Text>
                    </View>
                    <ChevronRight color={COLORS.text2} size={16} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No matching employees found in roster.</Text>
                </View>
              }
            />
          </View>

  );
}
