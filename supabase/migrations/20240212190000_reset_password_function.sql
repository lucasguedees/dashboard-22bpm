-- Função para redefinir a senha de um usuário (apenas para administradores)
CREATE OR REPLACE FUNCTION reset_user_password(user_id uuid, new_password text)
RETURNS json AS $$
DECLARE
  result json;
  is_admin boolean;
BEGIN
  -- Verifica se o usuário que está executando a função é administrador
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN app_users au ON u.id = au.auth_user_id
    WHERE u.id = auth.uid() AND au.role = 'ADMIN'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RETURN json_build_object('error', 'Apenas administradores podem redefinir senhas');
  END IF;
  
  -- Atualiza a senha do usuário usando a função de autenticação do Supabase
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_id
  RETURNING 
    json_build_object(
      'user_id', id,
      'email', email,
      'message', 'Senha atualizada com sucesso'
    ) INTO result;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Usuário não encontrado');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concede permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION reset_user_password(uuid, text) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION reset_user_password IS 'Redefine a senha de um usuário. Apenas administradores podem usar esta função.';

-- Adicione ao seu arquivo de migração ou execute no SQL Editor
CREATE POLICY "deleted_users_select_admin"
ON public.deleted_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth.uid() = app_users.auth_user_id
    AND app_users.role = 'ADMIN'
  )
);