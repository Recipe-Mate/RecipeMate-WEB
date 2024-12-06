import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import main from "./screens/main";
import recipe from "./screens/recipe";
import bill from "./screens/bill";
import profile from "./screens/profile";

const Stack = createStackNavigator();

const ingredient_db = [
  {key: '대파'},
  {key: '양파'},
  {key: '감자'},
  {key: '고구마'},
  {key: '무'},
  {key: '콩나물'},
  {key: '두부'},
  {key: '돼지고기'},
  {key: '소고기'},
  {key: '닭'},
  {key: '상추'},
  {key: '배추'},
  {key: '깻잎'},
  {key: '생강'},
  {key: '마늘'},
  {key: '브로콜리'},
  {key: '애호박'},
  {key: '단호박'},
  {key: '파인애플'},
  {key: '오리'},
  {key: '사과'},
]


export default function App() {
  return (

    <View style={{flex:1}}>
      <View style={styles.header}></View>
      <View style={styles.box}>
        <Text style={styles.title}>식재료 목록</Text>
        <FlatList
          data={ingredient_db}
          renderItem={({item}) => <Text style={styles.ingredient}>{item.key}</Text>}
        />
      </View>
      <View style={{ height:90, backgroundColor:"#333f50"}}></View>
        

      <StatusBar style="auto" />
    </View>




  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: '#ffffff',
  },
  box: {
    flex: 10,
    backgroundColor: '#ffffff',
  },
  title: {
    marginLeft: 30,
    marginBottom: 30,
    fontSize: 35,
    fontWeight: 900,
  },
  ingredient: {
    marginLeft: 30,
    marginBottom: 15,
    fontSize: 20,
  },
});
