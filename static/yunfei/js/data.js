const RegionData = {
    provinces: [
        { code: '110000', name: '北京市', cities: [
            { code: '110100', name: '北京市', districts: [
                { code: '110101', name: '东城区' },
                { code: '110102', name: '西城区' },
                { code: '110105', name: '朝阳区' },
                { code: '110106', name: '丰台区' },
                { code: '110107', name: '石景山区' },
                { code: '110108', name: '海淀区' },
                { code: '110109', name: '门头沟区' },
                { code: '110111', name: '房山区' },
                { code: '110112', name: '通州区' },
                { code: '110113', name: '顺义区' },
                { code: '110114', name: '昌平区' },
                { code: '110115', name: '大兴区' },
                { code: '110116', name: '怀柔区' },
                { code: '110117', name: '平谷区' },
                { code: '110118', name: '密云区' },
                { code: '110119', name: '延庆区' }
            ]}
        ]},
        { code: '310000', name: '上海市', cities: [
            { code: '310100', name: '上海市', districts: [
                { code: '310101', name: '黄浦区' },
                { code: '310104', name: '徐汇区' },
                { code: '310105', name: '长宁区' },
                { code: '310106', name: '静安区' },
                { code: '310107', name: '普陀区' },
                { code: '310109', name: '虹口区' },
                { code: '310110', name: '杨浦区' },
                { code: '310112', name: '闵行区' },
                { code: '310113', name: '宝山区' },
                { code: '310114', name: '嘉定区' },
                { code: '310115', name: '浦东新区' },
                { code: '310116', name: '金山区' },
                { code: '310117', name: '松江区' },
                { code: '310118', name: '青浦区' },
                { code: '310151', name: '崇明区' }
            ]}
        ]},
        { code: '120000', name: '天津市', cities: [
            { code: '120100', name: '天津市', districts: [
                { code: '120101', name: '和平区' },
                { code: '120102', name: '河东区' },
                { code: '120103', name: '河西区' },
                { code: '120104', name: '南开区' },
                { code: '120105', name: '河北区' },
                { code: '120106', name: '红桥区' },
                { code: '120110', name: '东丽区' },
                { code: '120111', name: '西青区' },
                { code: '120112', name: '津南区' },
                { code: '120113', name: '北辰区' },
                { code: '120114', name: '武清区' },
                { code: '120115', name: '宝坻区' },
                { code: '120116', name: '滨海新区' },
                { code: '120117', name: '宁河区' },
                { code: '120118', name: '静海区' },
                { code: '120119', name: '蓟州区' }
            ]}
        ]},
        { code: '500000', name: '重庆市', cities: [
            { code: '500100', name: '重庆市', districts: [
                { code: '500101', name: '万州区' },
                { code: '500102', name: '涪陵区' },
                { code: '500103', name: '渝中区' },
                { code: '500104', name: '大渡口区' },
                { code: '500105', name: '江北区' },
                { code: '500106', name: '沙坪坝区' },
                { code: '500107', name: '九龙坡区' },
                { code: '500108', name: '南岸区' },
                { code: '500109', name: '北碚区' },
                { code: '500110', name: '綦江区' },
                { code: '500111', name: '大足区' },
                { code: '500112', name: '渝北区' },
                { code: '500113', name: '巴南区' },
                { code: '500114', name: '黔江区' },
                { code: '500115', name: '长寿区' },
                { code: '500116', name: '江津区' },
                { code: '500117', name: '合川区' },
                { code: '500118', name: '永川区' },
                { code: '500119', name: '南川区' },
                { code: '500120', name: '璧山区' },
                { code: '500151', name: '铜梁区' },
                { code: '500152', name: '潼南区' },
                { code: '500153', name: '荣昌区' },
                { code: '500154', name: '开州区' },
                { code: '500155', name: '梁平区' },
                { code: '500156', name: '武隆区' }
            ]}
        ]},
        { code: '440000', name: '广东省', cities: [
            { code: '440100', name: '广州市', districts: [
                { code: '440103', name: '荔湾区' },
                { code: '440104', name: '越秀区' },
                { code: '440105', name: '海珠区' },
                { code: '440106', name: '天河区' },
                { code: '440111', name: '白云区' },
                { code: '440112', name: '黄埔区' },
                { code: '440113', name: '番禺区' },
                { code: '440114', name: '花都区' },
                { code: '440115', name: '南沙区' },
                { code: '440117', name: '从化区' },
                { code: '440118', name: '增城区' }
            ]},
            { code: '440300', name: '深圳市', districts: [
                { code: '440303', name: '罗湖区' },
                { code: '440304', name: '福田区' },
                { code: '440305', name: '南山区' },
                { code: '440306', name: '宝安区' },
                { code: '440307', name: '龙岗区' },
                { code: '440308', name: '盐田区' },
                { code: '440309', name: '龙华区' },
                { code: '440310', name: '坪山区' },
                { code: '440311', name: '光明区' }
            ]},
            { code: '440600', name: '佛山市', districts: [
                { code: '440604', name: '禅城区' },
                { code: '440605', name: '南海区' },
                { code: '440606', name: '顺德区' },
                { code: '440607', name: '三水区' },
                { code: '440608', name: '高明区' }
            ]},
            { code: '441900', name: '东莞市', districts: [
                { code: '441900', name: '东莞市' }
            ]},
            { code: '442000', name: '中山市', districts: [
                { code: '442000', name: '中山市' }
            ]},
            { code: '440400', name: '珠海市', districts: [
                { code: '440402', name: '香洲区' },
                { code: '440403', name: '斗门区' },
                { code: '440404', name: '金湾区' }
            ]},
            { code: '441300', name: '惠州市', districts: [
                { code: '441302', name: '惠城区' },
                { code: '441303', name: '惠阳区' },
                { code: '441322', name: '博罗县' },
                { code: '441323', name: '惠东县' },
                { code: '441324', name: '龙门县' }
            ]},
            { code: '440700', name: '江门市', districts: [
                { code: '440703', name: '蓬江区' },
                { code: '440704', name: '江海区' },
                { code: '440705', name: '新会区' },
                { code: '440781', name: '台山市' },
                { code: '440783', name: '开平市' }
            ]},
            { code: '440800', name: '湛江市', districts: [
                { code: '440802', name: '赤坎区' },
                { code: '440803', name: '霞山区' },
                { code: '440804', name: '坡头区' },
                { code: '440811', name: '麻章区' },
                { code: '440881', name: '廉江市' }
            ]},
            { code: '440900', name: '茂名市', districts: [
                { code: '440902', name: '茂南区' },
                { code: '440904', name: '电白区' },
                { code: '440981', name: '高州市' },
                { code: '440982', name: '化州市' }
            ]},
            { code: '445200', name: '揭阳市', districts: [
                { code: '445202', name: '榕城区' },
                { code: '445203', name: '揭东区' },
                { code: '445281', name: '普宁市' }
            ]},
            { code: '440500', name: '汕头市', districts: [
                { code: '440507', name: '龙湖区' },
                { code: '440511', name: '金平区' },
                { code: '440512', name: '濠江区' },
                { code: '440513', name: '潮阳区' },
                { code: '440514', name: '潮南区' }
            ]}
        ]},
        { code: '330000', name: '浙江省', cities: [
            { code: '330100', name: '杭州市', districts: [
                { code: '330102', name: '上城区' },
                { code: '330103', name: '下城区' },
                { code: '330104', name: '江干区' },
                { code: '330105', name: '拱墅区' },
                { code: '330106', name: '西湖区' },
                { code: '330108', name: '滨江区' },
                { code: '330109', name: '萧山区' },
                { code: '330110', name: '余杭区' },
                { code: '330111', name: '富阳区' },
                { code: '330112', name: '临安区' },
                { code: '330182', name: '建德市' },
                { code: '330127', name: '淳安县' }
            ]},
            { code: '330200', name: '宁波市', districts: [
                { code: '330203', name: '海曙区' },
                { code: '330205', name: '江北区' },
                { code: '330206', name: '北仑区' },
                { code: '330211', name: '镇海区' },
                { code: '330212', name: '鄞州区' },
                { code: '330213', name: '奉化区' },
                { code: '330281', name: '余姚市' },
                { code: '330282', name: '慈溪市' }
            ]},
            { code: '330300', name: '温州市', districts: [
                { code: '330302', name: '鹿城区' },
                { code: '330303', name: '龙湾区' },
                { code: '330304', name: '瓯海区' },
                { code: '330305', name: '洞头区' },
                { code: '330381', name: '瑞安市' },
                { code: '330382', name: '乐清市' }
            ]},
            { code: '330400', name: '嘉兴市', districts: [
                { code: '330402', name: '南湖区' },
                { code: '330411', name: '秀洲区' },
                { code: '330481', name: '海宁市' },
                { code: '330482', name: '平湖市' },
                { code: '330483', name: '桐乡市' }
            ]},
            { code: '330600', name: '绍兴市', districts: [
                { code: '330602', name: '越城区' },
                { code: '330603', name: '柯桥区' },
                { code: '330604', name: '上虞区' },
                { code: '330681', name: '诸暨市' },
                { code: '330683', name: '嵊州市' }
            ]},
            { code: '330700', name: '金华市', districts: [
                { code: '330702', name: '婺城区' },
                { code: '330703', name: '金东区' },
                { code: '330782', name: '义乌市' },
                { code: '330783', name: '东阳市' },
                { code: '330784', name: '永康市' }
            ]},
            { code: '330800', name: '衢州市', districts: [
                { code: '330802', name: '柯城区' },
                { code: '330803', name: '衢江区' },
                { code: '330881', name: '江山市' }
            ]},
            { code: '331000', name: '台州市', districts: [
                { code: '331002', name: '椒江区' },
                { code: '331003', name: '黄岩区' },
                { code: '331004', name: '路桥区' },
                { code: '331081', name: '温岭市' },
                { code: '331082', name: '临海市' }
            ]},
            { code: '331100', name: '丽水市', districts: [
                { code: '331102', name: '莲都区' },
                { code: '331181', name: '龙泉市' }
            ]}
        ]},
        { code: '320000', name: '江苏省', cities: [
            { code: '320100', name: '南京市', districts: [
                { code: '320102', name: '玄武区' },
                { code: '320104', name: '秦淮区' },
                { code: '320105', name: '建邺区' },
                { code: '320106', name: '鼓楼区' },
                { code: '320111', name: '浦口区' },
                { code: '320113', name: '栖霞区' },
                { code: '320114', name: '雨花台区' },
                { code: '320115', name: '江宁区' },
                { code: '320116', name: '六合区' },
                { code: '320117', name: '溧水区' },
                { code: '320118', name: '高淳区' }
            ]},
            { code: '320200', name: '无锡市', districts: [
                { code: '320205', name: '锡山区' },
                { code: '320206', name: '惠山区' },
                { code: '320211', name: '滨湖区' },
                { code: '320213', name: '梁溪区' },
                { code: '320214', name: '新吴区' },
                { code: '320281', name: '江阴市' },
                { code: '320282', name: '宜兴市' }
            ]},
            { code: '320300', name: '徐州市', districts: [
                { code: '320302', name: '鼓楼区' },
                { code: '320303', name: '云龙区' },
                { code: '320311', name: '泉山区' },
                { code: '320312', name: '铜山区' },
                { code: '320381', name: '新沂市' },
                { code: '320382', name: '邳州市' }
            ]},
            { code: '320400', name: '常州市', districts: [
                { code: '320402', name: '天宁区' },
                { code: '320404', name: '钟楼区' },
                { code: '320411', name: '新北区' },
                { code: '320412', name: '武进区' },
                { code: '320413', name: '金坛区' },
                { code: '320481', name: '溧阳市' }
            ]},
            { code: '320500', name: '苏州市', districts: [
                { code: '320505', name: '虎丘区' },
                { code: '320506', name: '吴中区' },
                { code: '320507', name: '相城区' },
                { code: '320508', name: '姑苏区' },
                { code: '320509', name: '吴江区' },
                { code: '320581', name: '常熟市' },
                { code: '320582', name: '张家港市' },
                { code: '320583', name: '昆山市' },
                { code: '320585', name: '太仓市' }
            ]},
            { code: '320600', name: '南通市', districts: [
                { code: '320602', name: '崇川区' },
                { code: '320611', name: '港闸区' },
                { code: '320612', name: '通州区' },
                { code: '320681', name: '启东市' },
                { code: '320682', name: '如皋市' },
                { code: '320684', name: '海门市' }
            ]},
            { code: '320700', name: '连云港市', districts: [
                { code: '320703', name: '连云区' },
                { code: '320705', name: '新浦区' },
                { code: '320706', name: '海州区' },
                { code: '320722', name: '东海县' }
            ]},
            { code: '320800', name: '淮安市', districts: [
                { code: '320802', name: '清河区' },
                { code: '320803', name: '淮安区' },
                { code: '320804', name: '淮阴区' },
                { code: '320811', name: '清浦区' }
            ]},
            { code: '320900', name: '盐城市', districts: [
                { code: '320902', name: '亭湖区' },
                { code: '320903', name: '盐都区' },
                { code: '320981', name: '东台市' },
                { code: '320982', name: '大丰区' }
            ]},
            { code: '321000', name: '扬州市', districts: [
                { code: '321002', name: '广陵区' },
                { code: '321003', name: '邗江区' },
                { code: '321012', name: '江都区' },
                { code: '321081', name: '仪征市' },
                { code: '321084', name: '高邮市' }
            ]},
            { code: '321100', name: '镇江市', districts: [
                { code: '321102', name: '京口区' },
                { code: '321111', name: '润州区' },
                { code: '321112', name: '丹徒区' },
                { code: '321181', name: '丹阳市' },
                { code: '321182', name: '扬中市' },
                { code: '321183', name: '句容市' }
            ]},
            { code: '321200', name: '泰州市', districts: [
                { code: '321202', name: '海陵区' },
                { code: '321203', name: '高港区' },
                { code: '321204', name: '姜堰区' },
                { code: '321281', name: '兴化市' },
                { code: '321282', name: '靖江市' },
                { code: '321283', name: '泰兴市' }
            ]},
            { code: '321300', name: '宿迁市', districts: [
                { code: '321302', name: '宿城区' },
                { code: '321311', name: '宿豫区' },
                { code: '321322', name: '沭阳县' },
                { code: '321323', name: '泗阳县' },
                { code: '321324', name: '泗洪县' }
            ]}
        ]},
        { code: '340000', name: '安徽省', cities: [
            { code: '340100', name: '合肥市', districts: [
                { code: '340102', name: '瑶海区' },
                { code: '340103', name: '庐阳区' },
                { code: '340104', name: '蜀山区' },
                { code: '340111', name: '包河区' },
                { code: '340121', name: '长丰县' },
                { code: '340122', name: '肥东县' },
                { code: '340123', name: '肥西县' },
                { code: '340124', name: '庐江县' },
                { code: '340181', name: '巢湖市' }
            ]},
            { code: '340200', name: '芜湖市', districts: [
                { code: '340202', name: '镜湖区' },
                { code: '340203', name: '弋江区' },
                { code: '340207', name: '鸠江区' },
                { code: '340208', name: '三山区' },
                { code: '340221', name: '芜湖县' },
                { code: '340222', name: '繁昌县' },
                { code: '340223', name: '南陵县' },
                { code: '340281', name: '无为县' }
            ]},
            { code: '340300', name: '蚌埠市', districts: [
                { code: '340302', name: '龙子湖区' },
                { code: '340303', name: '蚌山区' },
                { code: '340304', name: '禹会区' },
                { code: '340311', name: '淮上区' },
                { code: '340321', name: '怀远县' },
                { code: '340322', name: '五河县' },
                { code: '340323', name: '固镇县' }
            ]},
            { code: '340400', name: '淮南市', districts: [
                { code: '340402', name: '大通区' },
                { code: '340403', name: '田家庵区' },
                { code: '340404', name: '谢家集区' },
                { code: '340405', name: '八公山区' },
                { code: '340406', name: '潘集区' },
                { code: '340421', name: '凤台县' }
            ]},
            { code: '340500', name: '马鞍山市', districts: [
                { code: '340503', name: '花山区' },
                { code: '340504', name: '雨山区' },
                { code: '340506', name: '博望区' },
                { code: '340521', name: '当涂县' }
            ]},
            { code: '340600', name: '淮北市', districts: [
                { code: '340602', name: '杜集区' },
                { code: '340603', name: '相山区' },
                { code: '340604', name: '烈山区' },
                { code: '340621', name: '濉溪县' }
            ]},
            { code: '340700', name: '铜陵市', districts: [
                { code: '340702', name: '铜官区' },
                { code: '340705', name: '义安区' },
                { code: '340722', name: '枞阳县' }
            ]},
            { code: '340800', name: '安庆市', districts: [
                { code: '340802', name: '迎江区' },
                { code: '340803', name: '大观区' },
                { code: '340811', name: '宜秀区' },
                { code: '340822', name: '怀宁县' },
                { code: '340881', name: '桐城市' }
            ]},
            { code: '341000', name: '黄山市', districts: [
                { code: '341002', name: '屯溪区' },
                { code: '341003', name: '黄山区' },
                { code: '341004', name: '徽州区' },
                { code: '341021', name: '歙县' },
                { code: '341022', name: '休宁县' },
                { code: '341024', name: '祁门县' }
            ]},
            { code: '341100', name: '滁州市', districts: [
                { code: '341102', name: '琅琊区' },
                { code: '341103', name: '南谯区' },
                { code: '341181', name: '天长市' },
                { code: '341182', name: '明光市' }
            ]},
            { code: '341200', name: '阜阳市', districts: [
                { code: '341202', name: '颍州区' },
                { code: '341203', name: '颍东区' },
                { code: '341204', name: '颍泉区' },
                { code: '341221', name: '临泉县' },
                { code: '341222', name: '太和县' },
                { code: '341282', name: '界首市' }
            ]},
            { code: '341300', name: '宿州市', districts: [
                { code: '341302', name: '埇桥区' },
                { code: '341321', name: '砀山县' },
                { code: '341322', name: '萧县' },
                { code: '341323', name: '灵璧县' },
                { code: '341324', name: '泗县' }
            ]}
        ]},
        { code: '370000', name: '山东省', cities: [
            { code: '370100', name: '济南市', districts: [
                { code: '370102', name: '历下区' },
                { code: '370103', name: '市中区' },
                { code: '370104', name: '槐荫区' },
                { code: '370105', name: '天桥区' },
                { code: '370112', name: '历城区' },
                { code: '370113', name: '长清区' },
                { code: '370114', name: '章丘区' },
                { code: '370115', name: '济阳区' },
                { code: '370116', name: '莱芜区' },
                { code: '370117', name: '钢城区' },
                { code: '370124', name: '平阴县' },
                { code: '370126', name: '商河县' }
            ]},
            { code: '370200', name: '青岛市', districts: [
                { code: '370202', name: '市南区' },
                { code: '370203', name: '市北区' },
                { code: '370211', name: '黄岛区' },
                { code: '370212', name: '崂山区' },
                { code: '370213', name: '李沧区' },
                { code: '370214', name: '城阳区' },
                { code: '370215', name: '即墨区' },
                { code: '370281', name: '胶州市' },
                { code: '370283', name: '平度市' },
                { code: '370285', name: '莱西市' }
            ]},
            { code: '370300', name: '淄博市', districts: [
                { code: '370302', name: '淄川区' },
                { code: '370303', name: '张店区' },
                { code: '370304', name: '博山区' },
                { code: '370305', name: '临淄区' },
                { code: '370306', name: '周村区' },
                { code: '370321', name: '桓台县' },
                { code: '370322', name: '高青县' },
                { code: '370323', name: '沂源县' }
            ]},
            { code: '370400', name: '枣庄市', districts: [
                { code: '370402', name: '市中区' },
                { code: '370403', name: '薛城区' },
                { code: '370404', name: '峄城区' },
                { code: '370405', name: '台儿庄区' },
                { code: '370406', name: '山亭区' },
                { code: '370481', name: '滕州市' }
            ]},
            { code: '370500', name: '东营市', districts: [
                { code: '370502', name: '东营区' },
                { code: '370503', name: '河口区' },
                { code: '370505', name: '垦利区' },
                { code: '370522', name: '利津县' },
                { code: '370523', name: '广饶县' }
            ]},
            { code: '370600', name: '烟台市', districts: [
                { code: '370602', name: '芝罘区' },
                { code: '370611', name: '福山区' },
                { code: '370612', name: '牟平区' },
                { code: '370613', name: '莱山区' },
                { code: '370681', name: '龙口市' },
                { code: '370682', name: '莱阳市' },
                { code: '370683', name: '莱州市' },
                { code: '370684', name: '蓬莱市' },
                { code: '370685', name: '招远市' },
                { code: '370686', name: '栖霞市' },
                { code: '370687', name: '海阳市' }
            ]},
            { code: '370700', name: '潍坊市', districts: [
                { code: '370702', name: '潍城区' },
                { code: '370703', name: '寒亭区' },
                { code: '370704', name: '坊子区' },
                { code: '370705', name: '奎文区' },
                { code: '370724', name: '临朐县' },
                { code: '370725', name: '昌乐县' },
                { code: '370781', name: '青州市' },
                { code: '370782', name: '诸城市' },
                { code: '370783', name: '寿光市' },
                { code: '370784', name: '安丘市' },
                { code: '370785', name: '高密市' },
                { code: '370786', name: '昌邑市' }
            ]},
            { code: '370800', name: '济宁市', districts: [
                { code: '370811', name: '任城区' },
                { code: '370812', name: '兖州区' },
                { code: '370826', name: '微山县' },
                { code: '370827', name: '鱼台县' },
                { code: '370828', name: '金乡县' },
                { code: '370829', name: '嘉祥县' },
                { code: '370830', name: '汶上县' },
                { code: '370831', name: '泗水县' },
                { code: '370832', name: '梁山县' },
                { code: '370881', name: '曲阜市' },
                { code: '370882', name: '邹城市' }
            ]},
            { code: '370900', name: '泰安市', districts: [
                { code: '370902', name: '泰山区' },
                { code: '370911', name: '岱岳区' },
                { code: '370921', name: '宁阳县' },
                { code: '370923', name: '东平县' },
                { code: '370982', name: '新泰市' },
                { code: '370983', name: '肥城市' }
            ]},
            { code: '371000', name: '威海市', districts: [
                { code: '371002', name: '环翠区' },
                { code: '371003', name: '文登区' },
                { code: '371082', name: '荣成市' },
                { code: '371083', name: '乳山市' }
            ]},
            { code: '371100', name: '日照市', districts: [
                { code: '371102', name: '东港区' },
                { code: '371103', name: '岚山区' },
                { code: '371121', name: '五莲县' },
                { code: '371122', name: '莒县' }
            ]},
            { code: '371200', name: '莱芜市', districts: [
                { code: '371202', name: '莱城区' },
                { code: '371203', name: '钢城区' }
            ]},
            { code: '371300', name: '临沂市', districts: [
                { code: '371302', name: '兰山区' },
                { code: '371311', name: '罗庄区' },
                { code: '371312', name: '河东区' },
                { code: '371321', name: '沂南县' },
                { code: '371322', name: '郯城县' },
                { code: '371323', name: '沂水县' },
                { code: '371324', name: '兰陵县' },
                { code: '371325', name: '费县' },
                { code: '371326', name: '平邑县' },
                { code: '371327', name: '莒南县' },
                { code: '371328', name: '蒙阴县' },
                { code: '371329', name: '临沭县' }
            ]},
            { code: '371400', name: '德州市', districts: [
                { code: '371402', name: '德城区' },
                { code: '371403', name: '陵城区' },
                { code: '371421', name: '宁津县' },
                { code: '371422', name: '庆云县' },
                { code: '371423', name: '临邑县' },
                { code: '371424', name: '齐河县' },
                { code: '371425', name: '平原县' },
                { code: '371426', name: '夏津县' },
                { code: '371427', name: '武城县' },
                { code: '371481', name: '乐陵市' },
                { code: '371482', name: '禹城市' }
            ]},
            { code: '371500', name: '聊城市', districts: [
                { code: '371502', name: '东昌府区' },
                { code: '371521', name: '阳谷县' },
                { code: '371522', name: '莘县' },
                { code: '371523', name: '茌平县' },
                { code: '371524', name: '东阿县' },
                { code: '371525', name: '冠县' },
                { code: '371526', name: '高唐县' },
                { code: '371581', name: '临清市' }
            ]},
            { code: '371600', name: '滨州市', districts: [
                { code: '371602', name: '滨城区' },
                { code: '371603', name: '沾化区' },
                { code: '371621', name: '惠民县' },
                { code: '371622', name: '阳信县' },
                { code: '371623', name: '无棣县' },
                { code: '371625', name: '博兴县' },
                { code: '371626', name: '邹平县' }
            ]},
            { code: '371700', name: '菏泽市', districts: [
                { code: '371702', name: '牡丹区' },
                { code: '371703', name: '定陶区' },
                { code: '371721', name: '曹县' },
                { code: '371722', name: '单县' },
                { code: '371723', name: '成武县' },
                { code: '371724', name: '巨野县' },
                { code: '371725', name: '郓城县' },
                { code: '371726', name: '鄄城县' },
                { code: '371727', name: '东明县' }
            ]}
        ]},
        { code: '410000', name: '河南省', cities: [
            { code: '410100', name: '郑州市', districts: [
                { code: '410102', name: '中原区' },
                { code: '410103', name: '二七区' },
                { code: '410104', name: '管城回族区' },
                { code: '410105', name: '金水区' },
                { code: '410106', name: '上街区' },
                { code: '410108', name: '惠济区' },
                { code: '410122', name: '中牟县' },
                { code: '410181', name: '巩义市' },
                { code: '410182', name: '荥阳市' },
                { code: '410183', name: '新密市' },
                { code: '410184', name: '新郑市' },
                { code: '410185', name: '登封市' }
            ]},
            { code: '410200', name: '开封市', districts: [
                { code: '410202', name: '龙亭区' },
                { code: '410203', name: '顺河回族区' },
                { code: '410204', name: '鼓楼区' },
                { code: '410205', name: '禹王台区' },
                { code: '410211', name: '祥符区' },
                { code: '410221', name: '杞县' },
                { code: '410222', name: '通许县' },
                { code: '410223', name: '尉氏县' },
                { code: '410225', name: '兰考县' }
            ]},
            { code: '410300', name: '洛阳市', districts: [
                { code: '410302', name: '老城区' },
                { code: '410303', name: '西工区' },
                { code: '410304', name: '瀍河回族区' },
                { code: '410305', name: '涧西区' },
                { code: '410306', name: '吉利区' },
                { code: '410311', name: '洛龙区' },
                { code: '410322', name: '孟津县' },
                { code: '410323', name: '新安县' },
                { code: '410324', name: '栾川县' },
                { code: '410325', name: '嵩县' },
                { code: '410326', name: '汝阳县' },
                { code: '410327', name: '宜阳县' },
                { code: '410328', name: '洛宁县' },
                { code: '410329', name: '伊川县' },
                { code: '410381', name: '偃师市' }
            ]},
            { code: '410400', name: '平顶山市', districts: [
                { code: '410402', name: '新华区' },
                { code: '410403', name: '卫东区' },
                { code: '410404', name: '石龙区' },
                { code: '410411', name: '湛河区' },
                { code: '410421', name: '宝丰县' },
                { code: '410422', name: '叶县' },
                { code: '410423', name: '鲁山县' },
                { code: '410425', name: '郏县' },
                { code: '410481', name: '舞钢市' },
                { code: '410482', name: '汝州市' }
            ]},
            { code: '410500', name: '安阳市', districts: [
                { code: '410502', name: '文峰区' },
                { code: '410503', name: '北关区' },
                { code: '410505', name: '殷都区' },
                { code: '410506', name: '龙安区' },
                { code: '410522', name: '安阳县' },
                { code: '410523', name: '汤阴县' },
                { code: '410526', name: '滑县' },
                { code: '410527', name: '内黄县' },
                { code: '410581', name: '林州市' }
            ]},
            { code: '410600', name: '鹤壁市', districts: [
                { code: '410602', name: '鹤山区' },
                { code: '410603', name: '山城区' },
                { code: '410611', name: '淇滨区' },
                { code: '410621', name: '浚县' },
                { code: '410622', name: '淇县' }
            ]},
            { code: '410700', name: '新乡市', districts: [
                { code: '410702', name: '红旗区' },
                { code: '410703', name: '卫滨区' },
                { code: '410704', name: '凤泉区' },
                { code: '410711', name: '牧野区' },
                { code: '410721', name: '新乡县' },
                { code: '410724', name: '获嘉县' },
                { code: '410725', name: '原阳县' },
                { code: '410726', name: '延津县' },
                { code: '410727', name: '封丘县' },
                { code: '410728', name: '长垣县' },
                { code: '410781', name: '卫辉市' },
                { code: '410782', name: '辉县市' }
            ]},
            { code: '410800', name: '焦作市', districts: [
                { code: '410802', name: '解放区' },
                { code: '410803', name: '中站区' },
                { code: '410804', name: '马村区' },
                { code: '410811', name: '山阳区' },
                { code: '410821', name: '修武县' },
                { code: '410822', name: '博爱县' },
                { code: '410823', name: '武陟县' },
                { code: '410825', name: '温县' },
                { code: '410882', name: '沁阳市' },
                { code: '410883', name: '孟州市' }
            ]},
            { code: '410900', name: '濮阳市', districts: [
                { code: '410902', name: '华龙区' },
                { code: '410922', name: '清丰县' },
                { code: '410923', name: '南乐县' },
                { code: '410926', name: '范县' },
                { code: '410927', name: '台前县' },
                { code: '410928', name: '濮阳县' }
            ]},
            { code: '411000', name: '许昌市', districts: [
                { code: '411002', name: '魏都区' },
                { code: '411003', name: '建安区' },
                { code: '411023', name: '许昌县' },
                { code: '411024', name: '鄢陵县' },
                { code: '411025', name: '襄城县' },
                { code: '411081', name: '禹州市' },
                { code: '411082', name: '长葛市' }
            ]},
            { code: '411100', name: '漯河市', districts: [
                { code: '411102', name: '源汇区' },
                { code: '411103', name: '郾城区' },
                { code: '411104', name: '召陵区' },
                { code: '411121', name: '舞阳县' },
                { code: '411122', name: '临颍县' }
            ]},
            { code: '411200', name: '三门峡市', districts: [
                { code: '411202', name: '湖滨区' },
                { code: '411203', name: '陕州区' },
                { code: '411221', name: '渑池县' },
                { code: '411224', name: '卢氏县' },
                { code: '411281', name: '义马市' },
                { code: '411282', name: '灵宝市' }
            ]},
            { code: '411300', name: '南阳市', districts: [
                { code: '411302', name: '宛城区' },
                { code: '411303', name: '卧龙区' },
                { code: '411321', name: '南召县' },
                { code: '411322', name: '方城县' },
                { code: '411323', name: '西峡县' },
                { code: '411324', name: '镇平县' },
                { code: '411325', name: '内乡县' },
                { code: '411326', name: '淅川县' },
                { code: '411327', name: '社旗县' },
                { code: '411328', name: '唐河县' },
                { code: '411329', name: '新野县' },
                { code: '411330', name: '桐柏县' },
                { code: '411381', name: '邓州市' }
            ]},
            { code: '411400', name: '商丘市', districts: [
                { code: '411402', name: '梁园区' },
                { code: '411403', name: '睢阳区' },
                { code: '411421', name: '民权县' },
                { code: '411422', name: '睢县' },
                { code: '411423', name: '宁陵县' },
                { code: '411424', name: '柘城县' },
                { code: '411425', name: '虞城县' },
                { code: '411426', name: '夏邑县' },
                { code: '411481', name: '永城市' }
            ]},
            { code: '411500', name: '信阳市', districts: [
                { code: '411502', name: '浉河区' },
                { code: '411503', name: '平桥区' },
                { code: '411521', name: '罗山县' },
                { code: '411522', name: '光山县' },
                { code: '411523', name: '新县' },
                { code: '411524', name: '商城县' },
                { code: '411525', name: '固始县' },
                { code: '411526', name: '潢川县' },
                { code: '411527', name: '淮滨县' },
                { code: '411528', name: '息县' }
            ]},
            { code: '411600', name: '周口市', districts: [
                { code: '411602', name: '川汇区' },
                { code: '411621', name: '扶沟县' },
                { code: '411622', name: '西华县' },
                { code: '411623', name: '商水县' },
                { code: '411624', name: '太康县' },
                { code: '411625', name: '鹿邑县' },
                { code: '411626', name: '郸城县' },
                { code: '411627', name: '淮阳县' },
                { code: '411628', name: '沈丘县' },
                { code: '411681', name: '项城市' }
            ]},
            { code: '411700', name: '驻马店市', districts: [
                { code: '411702', name: '驿城区' },
                { code: '411721', name: '西平县' },
                { code: '411722', name: '上蔡县' },
                { code: '411723', name: '平舆县' },
                { code: '411724', name: '正阳县' },
                { code: '411725', name: '确山县' },
                { code: '411726', name: '泌阳县' },
                { code: '411727', name: '汝南县' },
                { code: '411728', name: '遂平县' },
                { code: '411729', name: '新蔡县' }
            ]},
            { code: '419001', name: '济源市', districts: [
                { code: '419001', name: '济源市' }
            ]}
        ]},
        { code: '420000', name: '湖北省', cities: [
            { code: '420100', name: '武汉市', districts: [
                { code: '420102', name: '江岸区' },
                { code: '420103', name: '江汉区' },
                { code: '420104', name: '硚口区' },
                { code: '420105', name: '汉阳区' },
                { code: '420106', name: '武昌区' },
                { code: '420107', name: '青山区' },
                { code: '420111', name: '洪山区' },
                { code: '420112', name: '东西湖区' },
                { code: '420113', name: '汉南区' },
                { code: '420114', name: '蔡甸区' },
                { code: '420115', name: '江夏区' },
                { code: '420116', name: '黄陂区' },
                { code: '420117', name: '新洲区' }
            ]},
            { code: '420200', name: '黄石市', districts: [
                { code: '420202', name: '黄石港区' },
                { code: '420203', name: '西塞山区' },
                { code: '420204', name: '下陆区' },
                { code: '420205', name: '铁山区' },
                { code: '420222', name: '阳新县' },
                { code: '420281', name: '大冶市' }
            ]},
            { code: '420300', name: '十堰市', districts: [
                { code: '420302', name: '茅箭区' },
                { code: '420303', name: '张湾区' },
                { code: '420304', name: '郧阳区' },
                { code: '420322', name: '郧西县' },
                { code: '420323', name: '竹山县' },
                { code: '420324', name: '竹溪县' },
                { code: '420325', name: '房县' },
                { code: '420381', name: '丹江口市' }
            ]},
            { code: '420500', name: '宜昌市', districts: [
                { code: '420502', name: '西陵区' },
                { code: '420503', name: '伍家岗区' },
                { code: '420504', name: '点军区' },
                { code: '420505', name: '猇亭区' },
                { code: '420506', name: '夷陵区' },
                { code: '420525', name: '远安县' },
                { code: '420526', name: '兴山县' },
                { code: '420527', name: '秭归县' },
                { code: '420528', name: '长阳土家族自治县' },
                { code: '420529', name: '五峰土家族自治县' },
                { code: '420581', name: '宜都市' },
                { code: '420582', name: '当阳市' },
                { code: '420583', name: '枝江市' }
            ]},
            { code: '420600', name: '襄阳市', districts: [
                { code: '420602', name: '襄城区' },
                { code: '420606', name: '樊城区' },
                { code: '420607', name: '襄州区' },
                { code: '420624', name: '南漳县' },
                { code: '420625', name: '谷城县' },
                { code: '420626', name: '保康县' },
                { code: '420682', name: '老河口市' },
                { code: '420683', name: '枣阳市' },
                { code: '420684', name: '宜城市' }
            ]},
            { code: '420700', name: '鄂州市', districts: [
                { code: '420702', name: '梁子湖区' },
                { code: '420703', name: '华容区' },
                { code: '420704', name: '鄂城区' }
            ]},
            { code: '420800', name: '荆门市', districts: [
                { code: '420802', name: '东宝区' },
                { code: '420804', name: '掇刀区' },
                { code: '420821', name: '京山县' },
                { code: '420822', name: '沙洋县' },
                { code: '420881', name: '钟祥市' }
            ]},
            { code: '420900', name: '孝感市', districts: [
                { code: '420902', name: '孝南区' },
                { code: '420921', name: '孝昌县' },
                { code: '420922', name: '大悟县' },
                { code: '420923', name: '云梦县' },
                { code: '420981', name: '应城市' },
                { code: '420982', name: '安陆市' },
                { code: '420984', name: '汉川市' }
            ]},
            { code: '421000', name: '荆州市', districts: [
                { code: '421002', name: '沙市区' },
                { code: '421003', name: '荆州区' },
                { code: '421022', name: '公安县' },
                { code: '421023', name: '监利县' },
                { code: '421024', name: '江陵县' },
                { code: '421081', name: '石首市' },
                { code: '421083', name: '洪湖市' },
                { code: '421087', name: '松滋市' }
            ]},
            { code: '421100', name: '黄冈市', districts: [
                { code: '421102', name: '黄州区' },
                { code: '421121', name: '团风县' },
                { code: '421122', name: '红安县' },
                { code: '421123', name: '罗田县' },
                { code: '421124', name: '英山县' },
                { code: '421125', name: '浠水县' },
                { code: '421126', name: '蕲春县' },
                { code: '421127', name: '黄梅县' },
                { code: '421181', name: '麻城市' },
                { code: '421182', name: '武穴市' }
            ]},
            { code: '421200', name: '咸宁市', districts: [
                { code: '421202', name: '咸安区' },
                { code: '421221', name: '嘉鱼县' },
                { code: '421222', name: '通城县' },
                { code: '421223', name: '崇阳县' },
                { code: '421224', name: '通山县' },
                { code: '421281', name: '赤壁市' }
            ]},
            { code: '421300', name: '随州市', districts: [
                { code: '421302', name: '曾都区' },
                { code: '421321', name: '随县' },
                { code: '421381', name: '广水市' }
            ]}
        ]},
        { code: '350000', name: '福建省', cities: [
            { code: '350100', name: '福州市', districts: [
                { code: '350102', name: '鼓楼区' },
                { code: '350103', name: '台江区' },
                { code: '350104', name: '仓山区' },
                { code: '350105', name: '马尾区' },
                { code: '350111', name: '晋安区' },
                { code: '350112', name: '长乐区' },
                { code: '350121', name: '闽侯县' },
                { code: '350122', name: '连江县' },
                { code: '350123', name: '罗源县' },
                { code: '350124', name: '闽清县' },
                { code: '350125', name: '永泰县' },
                { code: '350128', name: '平潭县' },
                { code: '350181', name: '福清市' }
            ]},
            { code: '350200', name: '厦门市', districts: [
                { code: '350203', name: '思明区' },
                { code: '350205', name: '海沧区' },
                { code: '350206', name: '湖里区' },
                { code: '350211', name: '集美区' },
                { code: '350212', name: '同安区' },
                { code: '350213', name: '翔安区' }
            ]},
            { code: '350300', name: '莆田市', districts: [
                { code: '350302', name: '城厢区' },
                { code: '350303', name: '涵江区' },
                { code: '350304', name: '荔城区' },
                { code: '350305', name: '秀屿区' },
                { code: '350322', name: '仙游县' }
            ]},
            { code: '350400', name: '三明市', districts: [
                { code: '350402', name: '梅列区' },
                { code: '350403', name: '三元区' },
                { code: '350421', name: '明溪县' },
                { code: '350423', name: '清流县' },
                { code: '350424', name: '宁化县' },
                { code: '350425', name: '大田县' },
                { code: '350426', name: '尤溪县' },
                { code: '350427', name: '沙县' },
                { code: '350428', name: '将乐县' },
                { code: '350429', name: '泰宁县' },
                { code: '350430', name: '建宁县' },
                { code: '350481', name: '永安市' }
            ]},
            { code: '350500', name: '泉州市', districts: [
                { code: '350502', name: '鲤城区' },
                { code: '350503', name: '丰泽区' },
                { code: '350504', name: '洛江区' },
                { code: '350505', name: '泉港区' },
                { code: '350521', name: '惠安县' },
                { code: '350524', name: '安溪县' },
                { code: '350525', name: '永春县' },
                { code: '350526', name: '德化县' },
                { code: '350527', name: '金门县' },
                { code: '350581', name: '石狮市' },
                { code: '350582', name: '晋江市' },
                { code: '350583', name: '南安市' }
            ]},
            { code: '350600', name: '漳州市', districts: [
                { code: '350602', name: '芗城区' },
                { code: '350603', name: '龙文区' },
                { code: '350622', name: '云霄县' },
                { code: '350623', name: '漳浦县' },
                { code: '350624', name: '诏安县' },
                { code: '350625', name: '长泰县' },
                { code: '350626', name: '东山县' },
                { code: '350627', name: '南靖县' },
                { code: '350628', name: '平和县' },
                { code: '350629', name: '华安县' },
                { code: '350681', name: '龙海市' }
            ]},
            { code: '350700', name: '南平市', districts: [
                { code: '350702', name: '延平区' },
                { code: '350703', name: '建阳区' },
                { code: '350721', name: '顺昌县' },
                { code: '350722', name: '浦城县' },
                { code: '350723', name: '光泽县' },
                { code: '350724', name: '松溪县' },
                { code: '350725', name: '政和县' },
                { code: '350781', name: '邵武市' },
                { code: '350782', name: '武夷山市' },
                { code: '350783', name: '建瓯市' }
            ]},
            { code: '350800', name: '龙岩市', districts: [
                { code: '350802', name: '新罗区' },
                { code: '350803', name: '永定区' },
                { code: '350821', name: '长汀县' },
                { code: '350822', name: '上杭县' },
                { code: '350823', name: '武平县' },
                { code: '350824', name: '连城县' },
                { code: '350881', name: '漳平市' }
            ]},
            { code: '350900', name: '宁德市', districts: [
                { code: '350902', name: '蕉城区' },
                { code: '350921', name: '霞浦县' },
                { code: '350922', name: '古田县' },
                { code: '350923', name: '屏南县' },
                { code: '350924', name: '寿宁县' },
                { code: '350925', name: '周宁县' },
                { code: '350926', name: '柘荣县' },
                { code: '350981', name: '福安市' },
                { code: '350982', name: '福鼎市' }
            ]}
        ]},
        { code: '430000', name: '湖南省', cities: [
            { code: '430100', name: '长沙市', districts: [
                { code: '430102', name: '芙蓉区' },
                { code: '430103', name: '天心区' },
                { code: '430104', name: '岳麓区' },
                { code: '430105', name: '开福区' },
                { code: '430111', name: '雨花区' },
                { code: '430112', name: '望城区' },
                { code: '430121', name: '长沙县' },
                { code: '430181', name: '浏阳市' },
                { code: '430182', name: '宁乡市' }
            ]},
            { code: '430200', name: '株洲市', districts: [
                { code: '430202', name: '荷塘区' },
                { code: '430203', name: '芦淞区' },
                { code: '430204', name: '石峰区' },
                { code: '430211', name: '天元区' },
                { code: '430221', name: '株洲县' },
                { code: '430223', name: '攸县' },
                { code: '430224', name: '茶陵县' },
                { code: '430225', name: '炎陵县' },
                { code: '430281', name: '醴陵市' }
            ]},
            { code: '430300', name: '湘潭市', districts: [
                { code: '430302', name: '雨湖区' },
                { code: '430304', name: '岳塘区' },
                { code: '430321', name: '湘潭县' },
                { code: '430381', name: '湘乡市' },
                { code: '430382', name: '韶山市' }
            ]},
            { code: '430400', name: '衡阳市', districts: [
                { code: '430405', name: '珠晖区' },
                { code: '430406', name: '雁峰区' },
                { code: '430407', name: '石鼓区' },
                { code: '430408', name: '蒸湘区' },
                { code: '430412', name: '南岳区' },
                { code: '430421', name: '衡阳县' },
                { code: '430422', name: '衡南县' },
                { code: '430423', name: '衡山县' },
                { code: '430424', name: '衡东县' },
                { code: '430426', name: '祁东县' },
                { code: '430481', name: '耒阳市' },
                { code: '430482', name: '常宁市' }
            ]}
        ]},
        { code: '510000', name: '四川省', cities: [
            { code: '510100', name: '成都市', districts: [
                { code: '510104', name: '锦江区' },
                { code: '510105', name: '青羊区' },
                { code: '510106', name: '金牛区' },
                { code: '510107', name: '武侯区' },
                { code: '510108', name: '成华区' },
                { code: '510112', name: '龙泉驿区' },
                { code: '510113', name: '青白江区' },
                { code: '510114', name: '新都区' },
                { code: '510115', name: '温江区' },
                { code: '510116', name: '双流区' },
                { code: '510117', name: '郫都区' },
                { code: '510121', name: '金堂县' },
                { code: '510181', name: '都江堰市' },
                { code: '510182', name: '彭州市' },
                { code: '510183', name: '邛崃市' },
                { code: '510184', name: '崇州市' },
                { code: '510185', name: '简阳市' }
            ]},
            { code: '510300', name: '自贡市', districts: [
                { code: '510302', name: '自流井区' },
                { code: '510303', name: '贡井区' },
                { code: '510304', name: '大安区' },
                { code: '510311', name: '沿滩区' },
                { code: '510321', name: '荣县' },
                { code: '510322', name: '富顺县' }
            ]}
        ]},
        { code: '500000', name: '重庆市', cities: [
            { code: '500100', name: '重庆市', districts: [
                { code: '500101', name: '万州区' },
                { code: '500102', name: '涪陵区' },
                { code: '500103', name: '渝中区' },
                { code: '500104', name: '大渡口区' },
                { code: '500105', name: '江北区' },
                { code: '500106', name: '沙坪坝区' },
                { code: '500107', name: '九龙坡区' },
                { code: '500108', name: '南岸区' },
                { code: '500109', name: '北碚区' },
                { code: '500110', name: '綦江区' },
                { code: '500111', name: '大足区' },
                { code: '500112', name: '渝北区' },
                { code: '500113', name: '巴南区' },
                { code: '500114', name: '黔江区' },
                { code: '500115', name: '长寿区' },
                { code: '500116', name: '江津区' },
                { code: '500117', name: '合川区' },
                { code: '500118', name: '永川区' },
                { code: '500119', name: '南川区' }
            ]}
        ]},
        { code: '530000', name: '云南省', cities: [
            { code: '530100', name: '昆明市', districts: [
                { code: '530102', name: '五华区' },
                { code: '530103', name: '盘龙区' },
                { code: '530111', name: '官渡区' },
                { code: '530112', name: '西山区' },
                { code: '530113', name: '东川区' },
                { code: '530114', name: '呈贡区' },
                { code: '530121', name: '晋宁区' },
                { code: '530122', name: '富民县' },
                { code: '530181', name: '安宁市' }
            ]}
        ]},
        { code: '520000', name: '贵州省', cities: [
            { code: '520100', name: '贵阳市', districts: [
                { code: '520102', name: '南明区' },
                { code: '520103', name: '云岩区' },
                { code: '520111', name: '花溪区' },
                { code: '520112', name: '乌当区' },
                { code: '520113', name: '白云区' },
                { code: '520114', name: '观山湖区' },
                { code: '520121', name: '开阳县' },
                { code: '520122', name: '息烽县' },
                { code: '520123', name: '修文县' },
                { code: '520181', name: '清镇市' }
            ]}
        ]},
        { code: '450000', name: '广西壮族自治区', cities: [
            { code: '450100', name: '南宁市', districts: [
                { code: '450102', name: '兴宁区' },
                { code: '450103', name: '青秀区' },
                { code: '450104', name: '江南区' },
                { code: '450105', name: '西乡塘区' },
                { code: '450107', name: '良庆区' },
                { code: '450108', name: '邕宁区' },
                { code: '450109', name: '武鸣区' },
                { code: '450123', name: '隆安县' },
                { code: '450124', name: '马山县' },
                { code: '450125', name: '上林县' },
                { code: '450126', name: '宾阳县' },
                { code: '450127', name: '横县' }
            ]}
        ]},
        { code: '460000', name: '海南省', cities: [
            { code: '460100', name: '海口市', districts: [
                { code: '460105', name: '秀英区' },
                { code: '460106', name: '龙华区' },
                { code: '460107', name: '琼山区' },
                { code: '460108', name: '美兰区' }
            ]},
            { code: '460200', name: '三亚市', districts: [
                { code: '460202', name: '海棠区' },
                { code: '460203', name: '吉阳区' },
                { code: '460204', name: '天涯区' },
                { code: '460205', name: '崖州区' }
            ]}
        ]}
    ],
    
    getZones() {
        return [
            { id: 'sameCity', name: '同城', provinces: [], multiplier: 0.6 },
            { id: 'sameProvince', name: '同省', provinces: [], multiplier: 0.8 },
            { id: 'jzhw', name: '江浙沪皖', provinces: ['310000', '320000', '330000', '340000'], multiplier: 1.0 },
            { id: 'north', name: '华北区', provinces: ['110000', '120000', '130000', '140000', '150000'], multiplier: 1.2 },
            { id: 'south', name: '华南区', provinces: ['440000', '450000', '350000', '460000'], multiplier: 1.0 },
            { id: 'central', name: '华中区', provinces: ['370000', '410000', '420000', '430000', '360000'], multiplier: 1.1 },
            { id: 'southwest', name: '西南区', provinces: ['510000', '500000', '520000', '530000', '540000'], multiplier: 1.4 },
            { id: 'northwest', name: '西北区', provinces: ['610000', '620000', '630000', '640000', '650000'], multiplier: 1.5 },
            { id: 'northeast', name: '东北区', provinces: ['210000', '220000', '230000'], multiplier: 1.3 }
        ];
    },

    getZoneMultiplier(senderProvinceCode, receiverProvinceCode, senderCityCode, receiverCityCode) {
        if (senderCityCode === receiverCityCode) {
            return 0.6;
        }
        if (senderProvinceCode === receiverProvinceCode) {
            return 0.8;
        }
        
        const zones = this.getZones();
        for (let zone of zones) {
            if (zone.provinces.includes(receiverProvinceCode)) {
                return zone.multiplier;
            }
        }
        return 1.2;
    }
};

const ExpressCompanies = {
    companies: [
        { id: 'sf', name: '顺丰速运', icon: '🚀', basePrice: 12, firstWeight: 1, continuePrice: 6, volumeRatio: 6000, piecePrice: 15, discount: 0.95, discountText: '会员专享95折', deliveryTime: '次日达', serviceTypes: ['标快', '特快'] },
        { id: 'yt', name: '圆通速递', icon: '🔵', basePrice: 8, firstWeight: 1, continuePrice: 4, volumeRatio: 6000, piecePrice: 10, discount: 0.9, discountText: '新人9折优惠', deliveryTime: '隔日达', serviceTypes: ['标准'] },
        { id: 'zto', name: '中通快递', icon: '🟠', basePrice: 8, firstWeight: 1, continuePrice: 3.5, volumeRatio: 6000, piecePrice: 10, discount: 0.88, discountText: '满减优惠活动', deliveryTime: '隔日达', serviceTypes: ['标准'] },
        { id: 'yd', name: '韵达快递', icon: '🟡', basePrice: 7, firstWeight: 1, continuePrice: 3, volumeRatio: 5000, piecePrice: 9, discount: 0.92, discountText: '首重特惠价', deliveryTime: '2-3天', serviceTypes: ['标准'] },
        { id: 'ems', name: '邮政EMS', icon: '📮', basePrice: 10, firstWeight: 1, continuePrice: 5, volumeRatio: 6000, piecePrice: 12, discount: 1, discountText: '', deliveryTime: '2-3天', serviceTypes: ['标准', '特快'] },
        { id: 'jd', name: '京东物流', icon: '🐕', basePrice: 10, firstWeight: 1, continuePrice: 4.5, volumeRatio: 6000, piecePrice: 12, discount: 0.85, discountText: 'PLUS会员专享85折', deliveryTime: '次日达', serviceTypes: ['标快', '特快'] }
    ],
    
    getAll() {
        return this.companies;
    },
    
    getById(id) {
        return this.companies.find(c => c.id === id);
    }
};