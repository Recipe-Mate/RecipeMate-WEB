import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import apiConfig from '../../config/api.config';

const ServerStatusCheck = () => {
  const [serverStatus, setServerStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [serverUrl, setServerUrl] = useState(apiConfig.getApiUrl());

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      console.log(`서버 상태 확인 중: ${apiConfig.getApiUrl()}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      try {
        const response = await fetch(`${apiConfig.getApiUrl()}/api/system/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('서버 연결 성공');
          setServerStatus('online');
          setErrorMessage('');
        } else {
          console.warn(`서버 응답 오류: ${response.status}`);
          setServerStatus('offline');
          setErrorMessage(`서버 응답 오류 (${response.status})`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('서버 연결 실패:', fetchError);
        setServerStatus('offline');
        
        if (fetchError.name === 'AbortError') {
          setErrorMessage('서버 응답 시간 초과');
        } else if (fetchError.message.includes('Network request failed')) {
          setErrorMessage('네트워크 연결 오류');
        } else {
          setErrorMessage(`연결 오류: ${fetchError.message}`);
        }
      }
    } catch (error) {
      console.error('서버 상태 확인 중 예외 발생:', error);
      setServerStatus('offline');
      setErrorMessage(`오류: ${error.message}`);
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>서버 상태</Text>
      <Text style={styles.serverUrl}>{serverUrl}</Text>
      
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
          
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={checkServerStatus}
          >
            <Text style={styles.retryText}>재시도</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  serverUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
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
    marginBottom: 8,
    color: '#F44336',
    fontSize: 14,
    width: '100%',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default ServerStatusCheck;