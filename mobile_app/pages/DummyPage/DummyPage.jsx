import { Image, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import backgroundImage from '../../assets/floorPlan2.png'
 
export default function DummyPage(){
  
        return (
            <ImageZoom cropWidth={Dimensions.get('window').width}
                       cropHeight={Dimensions.get('window').height}
                       imageWidth={650}
                       imageHeight={700}>
                <Image style={{width:650, height:700}}
                       source={backgroundImage}/>
            </ImageZoom>
        )
}