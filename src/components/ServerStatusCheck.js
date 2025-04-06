import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import apiConfig from '../../config/api.config';

const ServerStatusCheck = () => {
  const [serverStatus, setServerStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // 서버가 아직 연동되지 않았으므로 항상 성공으로 처리
        // 실제 서버 연동 시 아래 주석 해제
        /*
        const response = await fetch(`${apiConfig.getApiUrl()}/api/health`);
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
          setErrorMessage('서버 응답이 정상적이지 않습니다.');
        }
        */
        
        // 테스트를 위해 항상 온라인 상태로 표시
        setTimeout(() => {
          setServerStatus('online');
        }, 1000);
      } catch (error) {
        console.error('서버 상태 확인 중 오류:', error);
        setServerStatus('offline');
        setErrorMessage('서버에 연결할 수 없습니다.');
      }
    };

    checkServerStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>서버 상태</Text>
      
      {serverStatus === 'checking' && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.checkingText}>서버 상태 확인 중...</Text>
        </View>
      )}
      
      {serverStatus === 'online' && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, styles.onlineIndicator]} />
          <Text style={styles.onlineText}>온라인</Text>
        </View>
      )}
      
      {serverStatus === 'offline' && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, styles.offlineIndicator]} />
          <Text style={styles.offlineText}>오프라인</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#F44336',
  },
  onlineText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  offlineText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  checkingText: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
  errorText: {
    marginTop: 8,
    color: '#F44336',
    fontSize: 14,
  },
});

export default ServerStatusCheck;