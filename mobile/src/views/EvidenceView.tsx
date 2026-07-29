import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { FileText, Download } from 'lucide-react-native';

export function EvidenceView({
  styles,
  COLORS,
  generateTarget,
  setGenerateTarget,
  handleGenerateDossier,
  isGeneratingDossier,
  vaultEvidence
}: any) {
  return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.pageTitleRow}>
              <Text style={styles.pageTitle}>Evidence Vault</Text>
              <View style={[styles.liveIndicator, { backgroundColor: COLORS.cyan + '20' }]}>
                <Text style={[styles.liveIndicatorText, { color: COLORS.cyan }]}>SECURED LOGS</Text>
              </View>
            </View>

            {/* Generate Dossier Action */}
            <View style={styles.evidenceGenCard}>
              <Text style={styles.evidenceGenTitle}>Generate Fraud Investigation Dossier</Text>
              <View style={styles.evidenceGenInputRow}>
                <TextInput
                  style={styles.evidenceGenInput}
                  value={generateTarget}
                  onChangeText={setGenerateTarget}
                  placeholder="EMP_ID (e.g. EMP_1024)"
                  placeholderTextColor="#666"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.evidenceGenBtn}
                  onPress={handleGenerateDossier}
                  disabled={isGeneratingDossier}
                >
                  {isGeneratingDossier ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.evidenceGenBtnText}>GENERATE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <FileText color={COLORS.cyan} size={15} />
              <Text style={styles.sectionTitle}>Archived PDF Evidence Logs</Text>
            </View>

            {vaultEvidence.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No dossiers generated yet. Try generating one above!</Text>
              </View>
            ) : (
              vaultEvidence.map((ev: any) => (
                <View key={ev.id} style={styles.evidenceRow}>
                  <View style={styles.evidenceLeft}>
                    <Text style={styles.evidenceEmpId}>{ev.emp_id}</Text>
                    <Text style={styles.evidenceFilename}>{ev.filename}</Text>
                    <Text style={styles.evidenceHash}>
                      Hash: {ev.hash} | Block: {ev.blockId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadIcon}
                    onPress={() => {
                      Alert.alert('Download Started', `Downloading Fraud_Evidence_${ev.emp_id}.pdf to device storage.`);
                    }}
                  >
                    <Download color={COLORS.cyan} size={18} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
  );
}
