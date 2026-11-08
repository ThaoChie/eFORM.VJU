-- V5__Seed_DRL_2026_template_and_criteria.sql
-- Seed dữ liệu chuẩn Biểu mẫu DRL-2026 version 1.0 và danh mục Tiêu chí rèn luyện

-- 1. Ensure Semester HK1_2026 exists and is ACTIVE
INSERT INTO semesters (semester_code, semester_name, academic_year, is_active, start_date, end_date)
VALUES ('HK1_2026', 'Học kỳ 1 Năm 2026-2027', '2026-2027', true, '2026-09-01', '2027-01-15')
ON CONFLICT (semester_code) DO UPDATE SET is_active = true;

-- 2. Seed FieldMaster records for DRL 2026
INSERT INTO field_master (field_code, field_name, data_type, category, is_required, min_value, max_value, description, is_active, version)
VALUES
  ('score_1_1', '1.1. Ý thức và thái độ trong học tập', 'NUMBER', 'Học tập & NCKH', true, 0, 3, 'Đi học đầy đủ, nghiêm túc trong giờ học, hoàn thành bài tập khi lên lớp.', true, '1.0'),
  ('score_1_2', '1.2. Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH', 'NUMBER', 'Học tập & NCKH', false, 0, 3, 'Tham gia tích cực một hoặc nhiều hoạt động giao lưu học thuật, NCKH, Ngoại ngữ.', true, '1.0'),
  ('score_1_3', '1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi', 'NUMBER', 'Học tập & NCKH', true, 0, 3, 'Chấp hành tốt quy chế thi và các quy định phòng thi.', true, '1.0'),
  ('score_1_4', '1.4. Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập', 'NUMBER', 'Học tập & NCKH', false, 0, 3, 'GPA duy trì >= 3.6 hoặc cải thiện so với kỳ trước.', true, '1.0'),
  ('score_1_5', '1.5. Kết quả học tập, nghiên cứu khoa học', 'NUMBER', 'Học tập & NCKH', true, 0, 8, 'Điểm kết quả học tập (GPA) và giải thưởng NCKH.', true, '1.0'),
  ('total_section_1', 'Tổng điểm mục 1 - Ý thức và kết quả học tập', 'NUMBER', 'Học tập & NCKH', false, 0, 20, 'Tổng điểm nhóm 1 tối đa 20 điểm.', true, '1.0'),

  ('score_2_1', '2.1. Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ GD&ĐT và ĐHQGHN', 'NUMBER', 'Nội quy & Quy chế', true, 0, 15, 'Nghiêm chỉnh chấp hành pháp luật, các chủ trương chính sách và quy định chung.', true, '1.0'),
  ('score_2_2', '2.2. Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và đơn vị', 'NUMBER', 'Nội quy & Quy chế', true, 0, 10, 'Chấp hành nội quy, quy chế thi cử, kỷ luật của Trường.', true, '1.0'),
  ('total_section_2', 'Tổng điểm mục 2 - Chấp hành nội quy, quy chế', 'NUMBER', 'Nội quy & Quy chế', false, 0, 25, 'Tổng điểm nhóm 2 tối đa 25 điểm.', true, '1.0'),

  ('score_3_1', '3.1. Ý thức và hiệu quả tham gia hoạt động chính trị, xã hội, văn hóa, thể thao', 'NUMBER', 'Chính trị - Xã hội', true, 0, 10, 'Tham gia tuần sinh hoạt công dân, hoạt động rèn luyện chính trị xã hội.', true, '1.0'),
  ('score_3_2', '3.2. Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ sự kiện', 'NUMBER', 'Chính trị - Xã hội', false, 0, 5, 'Có minh chứng kèm theo: danh sách tham dự, giấy chứng nhận, giấy khen...', true, '1.0'),
  ('score_3_3', '3.3. Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội', 'NUMBER', 'Chính trị - Xã hội', true, 0, 5, 'Tích cực tham gia giữ gìn an ninh trật tự, phòng chống tệ nạn học đường và xã hội.', true, '1.0'),
  ('total_section_3', 'Tổng điểm mục 3 - Hoạt động chính trị, xã hội', 'NUMBER', 'Chính trị - Xã hội', false, 0, 20, 'Tổng điểm nhóm 3 tối đa 20 điểm.', true, '1.0'),

  ('score_4_1', '4.1. Ý thức chấp hành và tuyên truyền chủ trương của Đảng, chính sách pháp luật trong cộng đồng', 'NUMBER', 'Công dân & Cộng đồng', true, 0, 10, 'Gương mẫu chấp hành pháp luật tại nơi cư trú và cộng đồng xã hội.', true, '1.0'),
  ('score_4_2', '4.2. Ý thức tham gia hoạt động xã hội có thành tích, hoạt động tình nguyện Đoàn TN', 'NUMBER', 'Công dân & Cộng đồng', false, 0, 10, 'Mùa đông ấm, Mùa hè xanh, Hiến máu nhân đạo...', true, '1.0'),
  ('score_4_3', '4.3. Tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn hoạn nạn', 'NUMBER', 'Công dân & Cộng đồng', false, 0, 5, 'Có hành động giúp đỡ bạn bè vượt khó, tham gia quyên góp ủng hộ cộng đồng.', true, '1.0'),
  ('total_section_4', 'Tổng điểm mục 4 - Phẩm chất công dân và cộng đồng', 'NUMBER', 'Công dân & Cộng đồng', false, 0, 25, 'Tổng điểm nhóm 4 tối đa 25 điểm.', true, '1.0'),

  ('score_5_1', '5.1. Ý thức, tinh thần, uy tín và hiệu quả công việc khi được phân công quản lý lớp, đoàn thể', 'NUMBER', 'Công tác đoàn thể', false, 0, 3, 'Cán bộ lớp, cán bộ Đoàn, Ban chủ nhiệm CLB.', true, '1.0'),
  ('score_5_2', '5.2. Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB', 'NUMBER', 'Công tác đoàn thể', false, 0, 2, 'Kỹ năng tổ chức hoạt động phong trào và quản lý tập thể.', true, '1.0'),
  ('score_5_3', '5.3. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và đơn vị', 'NUMBER', 'Công tác đoàn thể', true, 0, 2, 'Nhiệt tình tham gia chuẩn bị, điều phối các buổi sinh hoạt lớp và sự kiện.', true, '1.0'),
  ('score_5_4', '5.4. Thành tích đặc biệt trong học tập, rèn luyện góp phần quảng bá hình ảnh ĐHQGHN', 'NUMBER', 'Công tác đoàn thể', false, 0, 3, 'Giải thưởng văn thể mỹ, học thuật cấp Quốc gia/Quốc tế hoặc khen thưởng đặc biệt.', true, '1.0'),
  ('total_section_5', 'Tổng điểm mục 5 - Công tác lớp, đoàn thể', 'NUMBER', 'Công tác đoàn thể', false, 0, 10, 'Tổng điểm nhóm 5 tối đa 10 điểm.', true, '1.0'),

  ('total_drl_score', 'Tổng điểm rèn luyện', 'NUMBER', 'Tổng kết', false, 0, 100, 'Tổng điểm đánh giá kết quả rèn luyện cả kỳ.', true, '1.0'),
  ('drl_classification', 'Xếp loại rèn luyện', 'STRING', 'Tổng kết', false, null, null, 'Xếp loại rèn luyện: Xuất sắc, Tốt, Khá, Trung bình, Yếu, Kém.', true, '1.0')
ON CONFLICT (field_code) DO NOTHING;

-- 3. Seed FormVersion DRL-2026 version 1.0 (v1.0)
DO $$
DECLARE
    v_sem_id BIGINT;
    v_layout JSONB := '[
  {
    "id": "group_1",
    "type": "CRITERIA_GROUP",
    "fieldCode": "total_section_1",
    "title": "1. Ý thức và kết quả học tập, nghiên cứu khoa học",
    "description": "Đánh giá ý thức thái độ trên lớp, tham gia NCKH, thi học thuật, vượt khó và kết quả GPA.",
    "maxScore": 20,
    "calculationMode": "CLAMPED_SUM",
    "children": [
      {
        "id": "crit_1_1",
        "type": "CRITERIA",
        "fieldCode": "score_1_1",
        "title": "1.1. Ý thức và thái độ trong học tập",
        "description": "Đi học đầy đủ, nghiêm túc trong giờ học, hoàn thành bài tập khi lên lớp.",
        "maxScore": 3,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_1_2",
        "type": "CRITERIA",
        "fieldCode": "score_1_2",
        "title": "1.2. Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH",
        "description": "Tham gia tích cực một hoặc nhiều hoạt động giao lưu học thuật, NCKH, Ngoại ngữ.",
        "maxScore": 3,
        "isRequired": false,
        "requiresProof": true
      },
      {
        "id": "crit_1_3",
        "type": "CRITERIA",
        "fieldCode": "score_1_3",
        "title": "1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi",
        "description": "Chấp hành tốt quy chế thi và các quy định phòng thi.",
        "maxScore": 3,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_1_4",
        "type": "CRITERIA",
        "fieldCode": "score_1_4",
        "title": "1.4. Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập",
        "description": "+ GPA duy trì ≥ 3.6 hoặc kết quả kỳ này cao hơn kỳ trước: 3đ\\n+ GPA giảm trong khoảng 0.1đ – 0.3đ: 2đ\\n+ GPA giảm trong khoảng 0.3đ – 0.5đ: 1đ",
        "maxScore": 3,
        "isRequired": false,
        "requiresProof": false
      },
      {
        "id": "crit_1_5",
        "type": "CRITERIA",
        "fieldCode": "score_1_5",
        "title": "1.5. Kết quả học tập, nghiên cứu khoa học (Tối đa 8đ)",
        "description": "- Điểm kết quả học tập (GPA):\\n  + Khá (2.5 ≤ GPA < 3.2): 2đ\\n  + Giỏi (3.2 ≤ GPA < 3.6): 3đ\\n  + Xuất sắc (GPA ≥ 3.6): 4đ\\n- Đạt giải Nghiên cứu khoa học:\\n  + Cấp Khoa: 2đ | Cấp Trường: 3đ | Cấp ĐHQGHN: 4đ",
        "maxScore": 8,
        "isRequired": true,
        "requiresProof": true
      }
    ]
  },
  {
    "id": "group_2",
    "type": "CRITERIA_GROUP",
    "fieldCode": "total_section_2",
    "title": "2. Ý thức chấp hành các nội quy, quy chế, quy định của Trường và ĐHQGHN",
    "description": "Chấp hành chủ trương của Đảng, Nhà nước và nội quy, quy chế thi cử, kỷ luật của Trường.",
    "maxScore": 25,
    "calculationMode": "CLAMPED_SUM",
    "children": [
      {
        "id": "crit_2_1",
        "type": "CRITERIA",
        "fieldCode": "score_2_1",
        "title": "2.1. Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ GD&ĐT và ĐHQGHN",
        "description": "Nghiêm chỉnh chấp hành pháp luật, các chủ trương chính sách và quy định chung.",
        "maxScore": 15,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_2_2",
        "type": "CRITERIA",
        "fieldCode": "score_2_2",
        "title": "2.2. Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và đơn vị",
        "description": "- Vi phạm quy chế thi bị lập biên bản nhưng không bị đình chỉ thi: trừ 10đ\\n- Vi phạm quy chế thi bị lập biên bản và bị đình chỉ thi: trừ 20đ\\n- Kỷ luật mức Khiển trách: trừ 20đ | Cảnh cáo: trừ 25đ",
        "maxScore": 10,
        "isRequired": true,
        "requiresProof": false
      }
    ]
  },
  {
    "id": "group_3",
    "type": "CRITERIA_GROUP",
    "fieldCode": "total_section_3",
    "title": "3. Ý thức tham gia các hoạt động chính trị - xã hội, văn hoá, thể thao, phòng chống TNXH",
    "description": "Tham gia tuần sinh hoạt công dân, hoạt động rèn luyện chính trị xã hội, tình nguyện công ích.",
    "maxScore": 20,
    "calculationMode": "CLAMPED_SUM",
    "children": [
      {
        "id": "crit_3_1",
        "type": "CRITERIA",
        "fieldCode": "score_3_1",
        "title": "3.1. Ý thức và hiệu quả tham gia hoạt động chính trị, xã hội, văn hóa, thể thao",
        "description": "- Không tham gia Tuần Sinh hoạt công dân sinh viên: trừ 10đ\\n- Không tham gia hoạt động khác do Trường tổ chức/yêu cầu: vắng 1 lần trừ 5đ, từ 2 lần trở lên trừ 10đ",
        "maxScore": 10,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_3_2",
        "type": "CRITERIA",
        "fieldCode": "score_3_2",
        "title": "3.2. Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ sự kiện",
        "description": "Có minh chứng kèm theo: danh sách tham dự, giấy chứng nhận, giấy khen...",
        "maxScore": 5,
        "isRequired": false,
        "requiresProof": true
      },
      {
        "id": "crit_3_3",
        "type": "CRITERIA",
        "fieldCode": "score_3_3",
        "title": "3.3. Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội",
        "description": "Tích cực tham gia giữ gìn an ninh trật tự, phòng chống tệ nạn học đường và xã hội.",
        "maxScore": 5,
        "isRequired": true,
        "requiresProof": false
      }
    ]
  },
  {
    "id": "group_4",
    "type": "CRITERIA_GROUP",
    "fieldCode": "total_section_4",
    "title": "4. Ý thức công dân và quan hệ với cộng đồng",
    "description": "Tuyên truyền chủ trương pháp luật, hoạt động tình nguyện Đoàn TN, tinh thần tương thân tương ái.",
    "maxScore": 25,
    "calculationMode": "CLAMPED_SUM",
    "children": [
      {
        "id": "crit_4_1",
        "type": "CRITERIA",
        "fieldCode": "score_4_1",
        "title": "4.1. Ý thức chấp hành và tuyên truyền chủ trương của Đảng, chính sách pháp luật trong cộng đồng",
        "description": "Gương mẫu chấp hành pháp luật tại nơi cư trú và cộng đồng xã hội.",
        "maxScore": 10,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_4_2",
        "type": "CRITERIA",
        "fieldCode": "score_4_2",
        "title": "4.2. Ý thức tham gia hoạt động xã hội có thành tích, hoạt động tình nguyện Đoàn TN",
        "description": "Mùa đông ấm, Mùa hè xanh, Hiến máu nhân đạo...\\n+ Tham gia tình nguyện trực tiếp: 10đ\\n+ Chuẩn bị cho các chiến dịch nhưng không tham dự: 5đ\\n(Có minh chứng kèm theo: giấy chứng nhận, giấy khen...)",
        "maxScore": 10,
        "isRequired": false,
        "requiresProof": true
      },
      {
        "id": "crit_4_3",
        "type": "CRITERIA",
        "fieldCode": "score_4_3",
        "title": "4.3. Tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn hoạn nạn",
        "description": "Có hành động giúp đỡ bạn bè vượt khó, tham gia quyên góp ủng hộ cộng đồng.",
        "maxScore": 5,
        "isRequired": false,
        "requiresProof": false
      }
    ]
  },
  {
    "id": "group_5",
    "type": "CRITERIA_GROUP",
    "fieldCode": "total_section_5",
    "title": "5. Ý thức và kết quả tham gia công tác lớp, đoàn thể, thành tích đặc biệt",
    "description": "Đảm nhận nhiệm vụ cán bộ lớp, Đoàn - Hội, kỹ năng tổ chức và thành tích đặc biệt cho ĐHQGHN.",
    "maxScore": 10,
    "calculationMode": "CLAMPED_SUM",
    "children": [
      {
        "id": "crit_5_1",
        "type": "CRITERIA",
        "fieldCode": "score_5_1",
        "title": "5.1. Ý thức, tinh thần, uy tín và hiệu quả công việc khi được phân công quản lý lớp, đoàn thể",
        "description": "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 3đ\\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\\n+ Trưởng ban các CLB: 1đ",
        "maxScore": 3,
        "isRequired": false,
        "requiresProof": false
      },
      {
        "id": "crit_5_2",
        "type": "CRITERIA",
        "fieldCode": "score_5_2",
        "title": "5.2. Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB",
        "description": "+ Chủ nhiệm, Bí thư, BĐH, BĐP, Ban Chấp hành: 2đ\\n+ Phó Chủ nhiệm, Phó Bí thư, Lớp phó: 2đ\\n+ Trưởng ban: 1đ",
        "maxScore": 2,
        "isRequired": false,
        "requiresProof": false
      },
      {
        "id": "crit_5_3",
        "type": "CRITERIA",
        "fieldCode": "score_5_3",
        "title": "5.3. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và đơn vị",
        "description": "Nhiệt tình tham gia chuẩn bị, điều phối các buổi sinh hoạt lớp và sự kiện.",
        "maxScore": 2,
        "isRequired": true,
        "requiresProof": false
      },
      {
        "id": "crit_5_4",
        "type": "CRITERIA",
        "fieldCode": "score_5_4",
        "title": "5.4. Thành tích đặc biệt trong học tập, rèn luyện góp phần quảng bá hình ảnh ĐHQGHN",
        "description": "Có giải thưởng văn thể mỹ, học thuật cấp Quốc gia/Quốc tế hoặc khen thưởng đặc biệt (Có minh chứng kèm theo).",
        "maxScore": 3,
        "isRequired": false,
        "requiresProof": true
      }
    ]
  }
]';
BEGIN
    SELECT id INTO v_sem_id FROM semesters WHERE semester_code = 'HK1_2026' LIMIT 1;
    IF v_sem_id IS NOT NULL THEN
        -- Insert or update DRL-2026 v1.0
        IF NOT EXISTS (SELECT 1 FROM form_versions WHERE form_code = 'DRL-2026' AND version_no = 'v1.0') THEN
            INSERT INTO form_versions (form_code, form_name, version_no, semester_id, template_layout_json, status)
            VALUES ('DRL-2026', 'Phiếu Đánh giá Điểm Rèn luyện Sinh viên 2026', 'v1.0', v_sem_id, v_layout, 'ACTIVE');
        ELSE
            UPDATE form_versions
            SET template_layout_json = v_layout, status = 'ACTIVE', semester_id = v_sem_id
            WHERE form_code = 'DRL-2026' AND version_no = 'v1.0';
        END IF;

        -- 4. Seed Criteria for this semester if not exists
        IF NOT EXISTS (SELECT 1 FROM criteria WHERE semester_id = v_sem_id) THEN
            INSERT INTO criteria (semester_id, field_id, criteria_code, title, category, max_score, requires_proof, order_index)
            VALUES
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_1_1' LIMIT 1), 'score_1_1', '1.1. Ý thức và thái độ trong học tập', 'Học tập & NCKH', 3.0, false, 1),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_1_2' LIMIT 1), 'score_1_2', '1.2. Ý thức, thái độ tham gia các CLB học thuật, hoạt động ngoại khóa, giao lưu, NCKH', 'Học tập & NCKH', 3.0, true, 2),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_1_3' LIMIT 1), 'score_1_3', '1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi', 'Học tập & NCKH', 3.0, false, 3),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_1_4' LIMIT 1), 'score_1_4', '1.4. Tinh thần vượt khó, có nỗ lực phấn đấu vươn lên trong học tập', 'Học tập & NCKH', 3.0, false, 4),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_1_5' LIMIT 1), 'score_1_5', '1.5. Kết quả học tập, nghiên cứu khoa học (Tối đa 8đ)', 'Học tập & NCKH', 8.0, true, 5),

              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_2_1' LIMIT 1), 'score_2_1', '2.1. Ý thức chấp hành các văn bản chỉ đạo của Đảng, Nhà nước, Bộ GD&ĐT và ĐHQGHN', 'Nội quy & Quy chế', 15.0, false, 6),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_2_2' LIMIT 1), 'score_2_2', '2.2. Ý thức chấp hành các nội quy, quy chế, quy định của Khoa, Trường và đơn vị', 'Nội quy & Quy chế', 10.0, false, 7),

              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_3_1' LIMIT 1), 'score_3_1', '3.1. Ý thức và hiệu quả tham gia hoạt động chính trị, xã hội, văn hóa, thể thao', 'Chính trị - Xã hội', 10.0, false, 8),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_3_2' LIMIT 1), 'score_3_2', '3.2. Tham gia các hoạt động công ích, tình nguyện, công tác xã hội, hỗ trợ sự kiện', 'Chính trị - Xã hội', 5.0, true, 9),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_3_3' LIMIT 1), 'score_3_3', '3.3. Ý thức tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn xã hội', 'Chính trị - Xã hội', 5.0, false, 10),

              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_4_1' LIMIT 1), 'score_4_1', '4.1. Ý thức chấp hành và tuyên truyền chủ trương của Đảng, chính sách pháp luật trong cộng đồng', 'Công dân & Cộng đồng', 10.0, false, 11),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_4_2' LIMIT 1), 'score_4_2', '4.2. Ý thức tham gia hoạt động xã hội có thành tích, hoạt động tình nguyện Đoàn TN', 'Công dân & Cộng đồng', 10.0, true, 12),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_4_3' LIMIT 1), 'score_4_3', '4.3. Tinh thần chia sẻ, giúp đỡ bạn bè, người thân, người gặp khó khăn hoạn nạn', 'Công dân & Cộng đồng', 5.0, false, 13),

              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_5_1' LIMIT 1), 'score_5_1', '5.1. Ý thức, tinh thần, uy tín và hiệu quả công việc khi được phân công quản lý lớp, đoàn thể', 'Công tác đoàn thể', 3.0, false, 14),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_5_2' LIMIT 1), 'score_5_2', '5.2. Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn TN, Hội SV, CLB', 'Công tác đoàn thể', 2.0, false, 15),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_5_3' LIMIT 1), 'score_5_3', '5.3. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và đơn vị', 'Công tác đoàn thể', 2.0, false, 16),
              (v_sem_id, (SELECT id FROM field_master WHERE field_code = 'score_5_4' LIMIT 1), 'score_5_4', '5.4. Thành tích đặc biệt trong học tập, rèn luyện góp phần quảng bá hình ảnh ĐHQGHN', 'Công tác đoàn thể', 3.0, true, 17);
        END IF;
    END IF;
END $$;
