import React, {useEffect, useState} from 'react';
import {startCounter, stopCounter} from 'react-native-accurate-step-counter';
import {SafeAreaView, StyleSheet, Text, View} from 'react-native';

const Pedometer=()=>{
    const [steps,setSteps]=useState(0);
    useEffect(()=>{
        const config={
            default_threshold:15.0,
            default_delay:150000000,
            cheathInterval:3000,
            onStepCountChange:(stepCount)=>{setSteps(stepCount)},
            onCheat:()=>{console.log("user is cheating")}
        }
        startCounter(config);
        return ()=>{stopCounter()}
    },[]);
return (
    <SafeAreaView>
        <View style={styles.screen}>
            <Text style={styles.step}>{steps}</Text>
        </View>
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
    screen: {
      width: '100%',
      height: '30%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    step: {
      fontSize: 36
    }
  });

  export default Pedometer;