package ai.b605.creditclear.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ai.b605.creditclear.data.*
import ai.b605.creditclear.ui.theme.CreditClearTheme
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _showIntro = MutableStateFlow(true)
    val showIntro: StateFlow<Boolean> = _showIntro.asStateFlow()
    
    fun sendMessage(text: String) {
        if (text.isBlank() || _isLoading.value) return
        
        _showIntro.value = false
        
        val userMessage = ChatMessage(role = MessageRole.USER, content = text.trim())
        _messages.value = _messages.value + userMessage
        
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                val response = apiService.sendChatMessageSimple(
                    messages = _messages.value,
                    systemPrompt = SystemPrompts.CHAT_STRATEGIST
                )
                
                val assistantMessage = ChatMessage(
                    role = MessageRole.ASSISTANT,
                    content = response
                )
                _messages.value = _messages.value + assistantMessage
            } catch (e: Exception) {
                val errorMessage = ChatMessage(
                    role = MessageRole.ASSISTANT,
                    content = "Connection error. Please try again.",
                    isError = true
                )
                _messages.value = _messages.value + errorMessage
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun resetChat() {
        _messages.value = emptyList()
        _showIntro.value = true
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel = hiltViewModel()
) {
    val colors = CreditClearTheme.colors
    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val showIntro by viewModel.showIntro.collectAsState()
    
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Header
        TopAppBar(
            title = { LogoText() },
            actions = {
                if (messages.isNotEmpty()) {
                    IconButton(onClick = { viewModel.resetChat() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Reset",
                            tint = colors.textTertiary
                        )
                    }
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = colors.backgroundSecondary
            )
        )
        
        // Messages
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            if (showIntro) {
                item {
                    IntroSection(
                        onQuickStart = { text -> 
                            viewModel.sendMessage(text)
                        }
                    )
                }
            }
            
            items(messages) { message ->
                MessageBubble(message = message)
            }
            
            if (isLoading) {
                item {
                    TypingIndicator()
                }
            }
        }
        
        // Input
        ChatInputArea(
            value = inputText,
            onValueChange = { inputText = it },
            onSend = {
                viewModel.sendMessage(inputText)
                inputText = ""
            },
            isLoading = isLoading
        )
    }
}

@Composable
fun LogoText() {
    val colors = CreditClearTheme.colors
    Row {
        Text(
            text = "605b",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textPrimary
        )
        Text(
            text = ".ai",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = colors.bronze
        )
    }
}

@Composable
fun IntroSection(onQuickStart: (String) -> Unit) {
    val colors = CreditClearTheme.colors
    
    val quickStarts = listOf(
        "I'm a victim of identity theft" to Icons.Default.Shield,
        "I have collections to dispute" to Icons.Default.Description,
        "Break down my rights under FCRA" to Icons.Default.Balance,
        "What's the fastest path to clean credit?" to Icons.Default.Bolt
    )
    
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        // Header
        Row(
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(
                        brush = Brush.linearGradient(
                            listOf(
                                colors.bronze.copy(alpha = 0.2f),
                                colors.bronze.copy(alpha = 0.1f)
                            )
                        ),
                        shape = RoundedCornerShape(14.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.AutoAwesome,
                    contentDescription = null,
                    tint = colors.bronze,
                    modifier = Modifier.size(28.dp)
                )
            }
            
            Column {
                Text(
                    text = "AI Credit Strategist",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                Text(
                    text = "FCRA · FDCPA · Consumer Protection",
                    fontSize = 12.sp,
                    color = colors.textTertiary
                )
            }
        }
        
        // Intro text
        Text(
            text = SystemPrompts.INTRO_MESSAGE,
            fontSize = 15.sp,
            color = colors.textSecondary,
            lineHeight = 24.sp
        )
        
        // Quick starts
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            quickStarts.forEach { (text, icon) ->
                QuickStartButton(
                    text = text,
                    icon = icon,
                    onClick = { onQuickStart(text) }
                )
            }
        }
    }
}

@Composable
fun QuickStartButton(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    val colors = CreditClearTheme.colors
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.surface)
            .border(1.dp, colors.surfaceBorder, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(colors.surfaceBorder, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = colors.textSecondary,
                modifier = Modifier.size(16.dp)
            )
        }
        
        Text(
            text = text,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = colors.textSecondary,
            modifier = Modifier.weight(1f)
        )
        
        Icon(
            imageVector = Icons.Default.ArrowForward,
            contentDescription = null,
            tint = colors.textMuted,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
fun MessageBubble(message: ChatMessage) {
    val colors = CreditClearTheme.colors
    val isUser = message.role == MessageRole.USER
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .then(
                    if (isUser) {
                        Modifier.background(
                            brush = Brush.linearGradient(
                                listOf(colors.bronze, colors.bronzeDark)
                            )
                        )
                    } else {
                        Modifier
                            .background(
                                if (message.isError) colors.error.copy(alpha = 0.15f)
                                else colors.surface
                            )
                            .border(
                                1.dp,
                                if (message.isError) colors.error.copy(alpha = 0.3f)
                                else colors.surfaceBorder,
                                RoundedCornerShape(
                                    topStart = 16.dp,
                                    topEnd = 16.dp,
                                    bottomStart = 4.dp,
                                    bottomEnd = 16.dp
                                )
                            )
                    }
                )
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Text(
                text = message.content,
                fontSize = 15.sp,
                color = if (isUser) colors.background else colors.textPrimary,
                lineHeight = 22.sp
            )
        }
    }
}

@Composable
fun TypingIndicator() {
    val colors = CreditClearTheme.colors
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Start
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(colors.surface)
                .border(1.dp, colors.surfaceBorder, RoundedCornerShape(16.dp))
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(3) { index ->
                val alpha by animateFloatAsState(
                    targetValue = 1f,
                    animationSpec = infiniteRepeatable(
                        animation = keyframes {
                            durationMillis = 1400
                            0.4f at 0
                            1f at 400
                            0.4f at 800
                        },
                        initialStartOffset = StartOffset(index * 160)
                    ),
                    label = "dot_$index"
                )
                
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(
                            colors.textTertiary.copy(alpha = alpha),
                            CircleShape
                        )
                )
            }
        }
    }
}

@Composable
fun ChatInputArea(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    isLoading: Boolean
) {
    val colors = CreditClearTheme.colors
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.backgroundSecondary)
    ) {
        HorizontalDivider(color = colors.surfaceBorder)
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            // Text field
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.surface)
                    .border(1.dp, colors.surfaceBorder, RoundedCornerShape(12.dp))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    textStyle = TextStyle(
                        fontSize = 15.sp,
                        color = colors.textPrimary
                    ),
                    cursorBrush = SolidColor(colors.bronze),
                    modifier = Modifier.fillMaxWidth(),
                    decorationBox = { innerTextField ->
                        Box {
                            if (value.isEmpty()) {
                                Text(
                                    text = "Describe your situation...",
                                    fontSize = 15.sp,
                                    color = colors.textMuted
                                )
                            }
                            innerTextField()
                        }
                    }
                )
            }
            
            // Send button
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        brush = if (value.isNotBlank() && !isLoading) {
                            Brush.linearGradient(listOf(colors.bronze, colors.bronzeDark))
                        } else {
                            Brush.linearGradient(
                                listOf(
                                    colors.bronze.copy(alpha = 0.5f),
                                    colors.bronzeDark.copy(alpha = 0.5f)
                                )
                            )
                        }
                    )
                    .clickable(enabled = value.isNotBlank() && !isLoading) { onSend() },
                contentAlignment = Alignment.Center
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = colors.background,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.ArrowUpward,
                        contentDescription = "Send",
                        tint = colors.background,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
