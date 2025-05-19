import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const Statistics = () => {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('ingredients');
  const [period, setPeriod] = useState('month'); // month, year
  const [loading, setLoading] = useState(true);
  const [ingredientStats, setIngredientStats] = useState({
    categories: [],
    monthly: [],
    consumed: []
  });
  const [recipeStats, setRecipeStats] = useState({
    popular: [],
    frequency: []
  });

  // 차트 색상 (다크모드 대응)
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
    '#FF9F40', '#8AC54B', '#5D9CEC', '#FF5A5E', '#C9CBCF'
  ];

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.STATISTICS}?userId=${userId}&period=${period}`);
      
      if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다');
      }
      
      const data = await response.json();
      
      // 식재료 통계 데이터 설정
      setIngredientStats({
        categories: data.ingredientCategories || [],
        monthly: data.ingredientMonthly || [],
        consumed: data.consumedIngredients || []
      });
      
      // 레시피 통계 데이터 설정
      setRecipeStats({
        popular: data.popularRecipes || [],
        frequency: data.recipeFrequency || []
      });
      
    } catch (error) {
      console.error('통계 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIngredientStatistics = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // 카테고리 분포 차트 데이터
    const categoryData = ingredientStats.categories.map((item, index) => ({
      name: item.name,
      population: item.count,
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12
    }));

    // 월별 소비량 차트 데이터
    const monthlyData = {
      labels: ingredientStats.monthly.map(item => item.month),
      datasets: [
        {
          data: ingredientStats.monthly.map(item => item.count),
          color: () => colors.primary,
          strokeWidth: 2
        }
      ],
      legend: [t('consumption')]
    };

    // 가장 많이 소비한 식재료 데이터
    const consumedData = {
      labels: ingredientStats.consumed.map(item => 
        item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name
      ),
      datasets: [
        {
          data: ingredientStats.consumed.map(item => item.count)
        }
      ]
    };

    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              period === 'month' && styles.activePeriodButton,
              { borderColor: colors.primary }
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text 
              style={[
                styles.periodButtonText, 
                period === 'month' && { color: colors.primary },
                { color: period === 'month' ? colors.primary : colors.text }
              ]}
            >
              {t('month')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              period === 'year' && styles.activePeriodButton,
              { borderColor: colors.primary }
            ]}
            onPress={() => setPeriod('year')}
          >
            <Text 
              style={[
                styles.periodButtonText, 
                period === 'year' && { color: colors.primary },
                { color: period === 'year' ? colors.primary : colors.text }
              ]}
            >
              {t('year')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('categoryDistribution')}</Text>
          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={width - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="pie-chart-outline" size={40} color={colors.gray} />
              <Text style={[styles.noDataText, { color: colors.gray }]}>{t('noData')}</Text>
            </View>
          )}
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('monthlyConsumption')}</Text>
          {ingredientStats.monthly.length > 0 ? (
            <LineChart
              data={monthlyData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(130, 181, 225, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: colors.primary
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="trending-up-outline" size={40} color={colors.gray} />
              <Text style={[styles.noDataText, { color: colors.gray }]}>{t('noData')}</Text>
            </View>
          )}
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('topConsumedIngredients')}</Text>
          {ingredientStats.consumed.length > 0 ? (
            <BarChart
              data={consumedData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(130, 181, 225, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16
                },
                barPercentage: 0.5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="bar-chart-outline" size={40} color={colors.gray} />
              <Text style={[styles.noDataText, { color: colors.gray }]}>{t('noData')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderRecipeStatistics = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // 인기 레시피 데이터
    const popularData = {
      labels: recipeStats.popular.map(item => 
        item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name
      ),
      datasets: [
        {
          data: recipeStats.popular.map(item => item.count)
        }
      ]
    };

    // 레시피 이용 빈도 데이터
    const frequencyData = {
      labels: recipeStats.frequency.map(item => item.month),
      datasets: [
        {
          data: recipeStats.frequency.map(item => item.count),
          color: () => colors.primary,
          strokeWidth: 2
        }
      ],
      legend: [t('usage')]
    };

    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              period === 'month' && styles.activePeriodButton,
              { borderColor: colors.primary }
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text 
              style={[
                styles.periodButtonText, 
                { color: period === 'month' ? colors.primary : colors.text }
              ]}
            >
              {t('month')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              period === 'year' && styles.activePeriodButton,
              { borderColor: colors.primary }
            ]}
            onPress={() => setPeriod('year')}
          >
            <Text 
              style={[
                styles.periodButtonText, 
                { color: period === 'year' ? colors.primary : colors.text }
              ]}
            >
              {t('year')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('popularRecipes')}</Text>
          {recipeStats.popular.length > 0 ? (
            <BarChart
              data={popularData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(130, 181, 225, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16
                },
                barPercentage: 0.5,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="bar-chart-outline" size={40} color={colors.gray} />
              <Text style={[styles.noDataText, { color: colors.gray }]}>{t('noData')}</Text>
            </View>
          )}
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('recipeUsageFrequency')}</Text>
          {recipeStats.frequency.length > 0 ? (
            <LineChart
              data={frequencyData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(130, 181, 225, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: colors.primary
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="trending-up-outline" size={40} color={colors.gray} />
              <Text style={[styles.noDataText, { color: colors.gray }]}>{t('noData')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'ingredients' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('ingredients')}
        >
          <Icon 
            name="nutrition-outline" 
            size={20} 
            color={activeTab === 'ingredients' ? colors.primary : colors.gray} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'ingredients' ? colors.primary : colors.gray }
            ]}
          >
            {t('ingredients')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'recipes' && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('recipes')}
        >
          <Icon 
            name="book-outline" 
            size={20} 
            color={activeTab === 'recipes' ? colors.primary : colors.gray} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'recipes' ? colors.primary : colors.gray }
            ]}
          >
            {t('recipes')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ingredients' ? renderIngredientStatistics() : renderRecipeStatistics()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 50,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  activePeriodButton: {
    backgroundColor: 'rgba(130, 181, 225, 0.2)',
  },
  periodButtonText: {
    fontSize: 14,
  },
  chartContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 8,
    fontSize: 16,
  },
});

export default Statistics;
