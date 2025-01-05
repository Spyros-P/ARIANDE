from predict import predict_wall_mask

mask = predict_wall_mask("../../assets/temp_images/temp_image_rooms.jpg", "../../predict_walls/UNet-Pytorch-Customdataset/outputs/image.jpg", 25, "../../models/checkpoint_epoch500.pth", scale=2)

print(mask[200])