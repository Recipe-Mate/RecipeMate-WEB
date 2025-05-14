import React from 'react';
import { Modal, View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const parseIngredientString = (line) => {
  line = String(line || '').trim();
  if (!line) return null;
  // Regex to capture name, amount, and unit
  const regex = /^(.*?)\s*([\d./]+)\s*([a-zA-Z가-힣μ]+)?(?:\s*\(.*\)|\s|$)/;
  const match = line.match(regex);
  if (match) {
    const name = (match[1] || '').trim();
    const amount = (match[2] || '0').trim();
    const unit = (match[3] || '').trim();
    if (!name) return null; // Must have a name
    return { name, amount, unit };
  }
  return null; // Not a parsable ingredient line
};

const SimpleRecipeDetailModal = ({ visible, onClose, recipeData }) => {
  if (!recipeData) {
    return null;
  }

  const getParsedIngredients = () => {
    const ingredients = recipeData.ingredient || recipeData.ingredients; // Handle both possible prop names
    if (!Array.isArray(ingredients)) return [];

    return ingredients
      .flatMap((ingredientItem, index) => {
        const parsedEntries = [];
        if (typeof ingredientItem === 'string') {
          const lines = ingredientItem.split('\n');
          lines.forEach((line, lineIdx) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              const parsed = parseIngredientString(trimmedLine);
              if (parsed) {
                parsedEntries.push({
                  id: `modal-str-ing-${index}-${lineIdx}-${Date.now()}`,
                  displayText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}`.trim(),
                });
              }
            }
          });
        } else if (typeof ingredientItem === 'object' && ingredientItem !== null) {
          // Attempt to construct a parsable string from known object structures
          let parsableString = '';
          if (ingredientItem.IRDNT_NM) { // From API structure
            parsableString = `${ingredientItem.IRDNT_NM} ${ingredientItem.IRDNT_CPCTY || ''}`.trim();
          } else if (ingredientItem.name) { // From manual entry or previous parsing
            parsableString = `${ingredientItem.name} ${ingredientItem.amount || ''} ${ingredientItem.unit || ''}`.trim();
          }
          
          if (parsableString) {
            const parsed = parseIngredientString(parsableString);
            if (parsed) {
              parsedEntries.push({
                id: `modal-obj-ing-${index}-${Date.now()}`,
                displayText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}`.trim(),
              });
            }
          }
        }
        return parsedEntries;
      })
      .filter(Boolean);
  };

  const displayIngredients = getParsedIngredients();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close-circle-outline" size={30} color="#333" />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{recipeData.title || recipeData.recipeName || '레시피 정보'}</Text>

            {recipeData.attFileNoMk && (
              <Image source={{ uri: recipeData.attFileNoMk }} style={styles.thumbnail} resizeMode="cover" />
            )}

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>재료</Text>
              {displayIngredients && displayIngredients.length > 0 ? (
                <FlatList
                  data={displayIngredients}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <Text style={styles.listItem}>- {item.displayText}</Text>}
                  scrollEnabled={false} // To ensure parent ScrollView handles scrolling
                />
              ) : (
                <Text style={styles.emptyText}>재료 정보가 없습니다.</Text>
              )}
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>조리 방법</Text>
              {recipeData.cookingProcess && recipeData.cookingProcess.length > 0 ? (
                <FlatList
                  data={recipeData.cookingProcess}
                  keyExtractor={(item, index) => `step-${index}`}
                  renderItem={({ item }) => (
                    <View style={styles.stepContainer}>
                      <Text style={styles.stepText}>{item}</Text>
                    </View>
                  )}
                  scrollEnabled={false} // To ensure parent ScrollView handles scrolling
                />
              ) : (
                <Text style={styles.emptyText}>조리 방법 정보가 없습니다.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    paddingTop: 45, // To make space for close button
    alignItems: 'stretch', // Changed from 'center' to 'stretch' for better content layout
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  listItem: {
    fontSize: 16,
    color: '#555',
    paddingVertical: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginRight: 5,
  },
  stepText: {
    fontSize: 16,
    color: '#555',
    flex: 1, // Allow text to wrap
  },
  emptyText: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SimpleRecipeDetailModal;