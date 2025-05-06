-- conversations 테이블의 모든 레코드 조회
SELECT * FROM conversations;

-- 특정 user_id와 persona_id에 대한 대화 조회
SELECT * FROM conversations 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
AND persona_id = '11111111-1111-1111-1111-111111111111';

-- 특정 conversation_id에 대한 레코드 조회
SELECT * FROM conversations 
WHERE id = 'your-conversation-id-here';

-- 가장 최근 생성된 conversations 조회 (최근 10개)
SELECT * FROM conversations 
ORDER BY created_at DESC 
LIMIT 10;

-- 특정 conversation_id에 대한 messages 조회
SELECT m.* FROM messages m
JOIN conversations c ON m.conversation_id = c.id
WHERE c.id = 'your-conversation-id-here'
ORDER BY m.created_at ASC;

-- 특정 conversation_id가 실제로 존재하는지 확인 (개수 확인)
SELECT COUNT(*) FROM conversations 
WHERE id = 'your-conversation-id-here';

-- 외래 키 제약 조건 확인
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'messages';

-- 새 conversation 생성 (테스트용)
INSERT INTO conversations (user_id, persona_id)
VALUES ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111')
RETURNING id; 